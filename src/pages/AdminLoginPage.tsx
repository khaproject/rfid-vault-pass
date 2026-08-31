import { useNavigate } from "react-router-dom";
import { Shield, Lock, ArrowLeft, Check, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminExists,
  createAdmin,
  setAdminSession,
  verifyAdmin,
  hasAdminSession,
} from "@/lib/admin-auth";
import { sound } from "@/lib/sound";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"loading" | "login" | "setup">("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Admin Panel — RFID VAULT PASS";
    if (hasAdminSession()) {
      void navigate("/admin/cards");
      return;
    }
    adminExists()
      .then((exists) => setMode(exists ? "login" : "setup"))
      .catch(() => setError("Gagal terhubung ke database cloud."));
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "setup") {
        if (password.length < 6) {
          throw new Error("Kata sandi minimal 6 karakter");
        }
        await createAdmin(password);
        sound.playSuccess();
      } else {
        const ok = await verifyAdmin(password);
        if (!ok) {
          sound.playDenied();
          throw new Error("Kata sandi admin salah");
        }
        sound.playSuccess();
      }
      setAdminSession();
      void navigate("/admin/cards");
    } catch (err) {
      sound.playDenied();
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center px-5 select-none bg-gradient-to-b from-background via-background/95 to-emerald-50/30">
      {/* Centered Clean Card Container */}
      <div className="w-full max-w-sm rounded-[32px] border border-border/80 bg-white p-7 shadow-2xl text-center flex flex-col items-center">
        {/* Header: Logo Icon with App Name at the right side */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-base font-extrabold tracking-tight text-foreground block leading-tight">
              RFID VAULT PASS
            </span>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Panel Pengelola
            </span>
          </div>
        </div>

        {/* Title and Description - Centered */}
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          {mode === "setup" ? "Inisialisasi Master Admin" : "Autentikasi Administrator"}
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[260px]">
          {mode === "setup"
            ? "Tentukan kata sandi master pertama (min. 6 karakter) untuk mengelola kartu RFID."
            : "Masukkan kata sandi untuk mengelola pendaftaran dan status kartu RFID."}
        </p>

        {/* Password Form */}
        <form className="mt-6 w-full space-y-3.5" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan Kata Sandi..."
              autoFocus
              className="w-full rounded-2xl border border-input bg-slate-50/70 px-4 py-3.5 text-center text-sm text-foreground outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 shadow-2xs"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive font-medium">
              {error}
            </p>
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={busy || mode === "loading" || !password.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/95 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>{busy ? "Memverifikasi..." : mode === "setup" ? "Simpan & Masuk" : "Konfirmasi Masuk"}</span>
          </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-slate-50/80 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Layar Utama</span>
          </button>
        </form>
      </div>
    </main>
  );
}

export default AdminLoginPage;

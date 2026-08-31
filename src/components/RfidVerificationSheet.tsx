import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle, ShieldAlert, Radio } from "lucide-react";

interface RfidVerificationSheetProps {
  open: boolean;
  stage: "scanning" | "processing" | "success" | "not_detected" | "not_registered" | "inactive" | "error";
  holderName?: string;
  role?: string;
  countdown?: number;
  onClose?: () => void;
}

export function RfidVerificationSheet({
  open,
  stage,
  holderName,
  role,
  countdown = 10,
  onClose,
}: RfidVerificationSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
      {/* Clean Bottom Sheet Container */}
      <div
        className={`w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] border border-border bg-white p-6 shadow-2xl transition-all duration-300 ease-out ${
          open ? "animate-slide-up" : "animate-slide-down"
        }`}
      >
        <div className="flex flex-col items-center text-center py-2 min-h-[220px] justify-center">
          {/* Phase 1: Scanning (Waiting for RFID Card with 10s Smart Timer) */}
          {stage === "scanning" && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative flex h-20 w-20 items-center justify-center mb-3">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400/30 duration-1000" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 shadow-xs">
                  <Radio className="h-8 w-8 animate-pulse text-emerald-600" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground">
                Menunggu Tempelan Kartu RFID...
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                Dekatkan kartu RFID ke bagian belakang ponsel Anda.
              </p>

              {/* Smart 10-second timer badge */}
              <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Mendeteksi sinyal ({countdown}d)</span>
              </div>
            </div>
          )}

          {/* Phase 2: Processing RFID Chip */}
          {stage === "processing" && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
              <div className="relative flex h-20 w-20 items-center justify-center mb-3">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 shadow-xs">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground">
                Sinyal RFID Terbaca!
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                Mencocokkan nomor seri chip RFID dengan database brankas...
              </p>
            </div>
          )}

          {/* Phase 3: Success */}
          {stage === "success" && (
            <div className="flex flex-col items-center animate-in zoom-in-90 fade-in duration-300">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-lg shadow-emerald-500/20">
                <CheckCircle className="h-10 w-10 text-emerald-600 animate-bounce" />
              </div>

              <h3 className="text-xl font-extrabold text-foreground">
                Verifikasi RFID Berhasil!
              </h3>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                Selamat Datang, {holderName || "Pemilik Kartu"}
              </p>
              {role && (
                <span className="mt-0.5 text-[11px] text-muted-foreground">
                  Akses: <span className="font-semibold text-foreground">{role}</span>
                </span>
              )}

              <p className="mt-3 text-xs text-muted-foreground animate-pulse">
                Membuka brankas password penting Anda...
              </p>
            </div>
          )}

          {/* Phase 4: Not Detected After 10s (TIDAK ADA TERDETEKSI) */}
          {stage === "not_detected" && (
            <div className="flex flex-col items-center animate-in fade-in duration-200">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
                <Radio className="h-8 w-8" />
              </div>

              <h3 className="text-base font-bold text-foreground">
                Tidak Ada Kartu RFID Terdeteksi
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-[250px] leading-relaxed">
                Dalam 10 detik belum ada sinyal kartu RFID yang menyentuh sensor ponsel Anda. Pastikan fitur NFC di ponsel sudah aktif.
              </p>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 rounded-xl border border-border bg-slate-50 px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-slate-100 transition cursor-pointer"
                >
                  Tutup & Coba Lagi
                </button>
              )}
            </div>
          )}

          {/* Phase 5: Not Registered (TERBACA TAPI TIDAK ADA DI DATABASE) */}
          {stage === "not_registered" && (
            <div className="flex flex-col items-center animate-in shake fade-in duration-200">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3 shadow-lg shadow-rose-500/20">
                <ShieldAlert className="h-9 w-9 text-rose-600" />
              </div>

              <h3 className="text-base font-bold text-foreground">Gagal Masuk: RFID Tidak Terdaftar</h3>
              <p className="mt-1 text-xs text-rose-600 max-w-[250px] font-medium leading-relaxed">
                Kartu RFID berhasil dibaca, namun UID kartu ini belum terdaftar di database brankas. Hubungi admin untuk mendaftarkan kartu.
              </p>
            </div>
          )}

          {/* Phase 6: Inactive */}
          {stage === "inactive" && (
            <div className="flex flex-col items-center animate-in shake fade-in duration-200">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-3 shadow-lg shadow-amber-500/20">
                <ShieldAlert className="h-9 w-9 text-amber-600" />
              </div>

              <h3 className="text-base font-bold text-foreground">Kartu RFID Dinonaktifkan</h3>
              <p className="mt-1 text-xs text-amber-700 max-w-[250px] font-medium leading-relaxed">
                Kartu ini telah dinonaktifkan oleh administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

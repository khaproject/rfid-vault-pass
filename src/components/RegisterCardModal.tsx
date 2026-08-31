import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PhoneCardTapAnimation } from "@/components/PhoneCardTapAnimation";
import { isWebNfcSupported, NfcScannerService } from "@/lib/nfc";
import { addCard } from "@/lib/rfid";
import { sound } from "@/lib/sound";
import { Radio, Check, AlertCircle, User, Briefcase, CreditCard } from "lucide-react";

interface RegisterCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardAdded: () => void;
}

export function RegisterCardModal({
  open,
  onOpenChange,
  onCardAdded,
}: RegisterCardModalProps) {
  const [stage, setStage] = useState<"ready" | "detected" | "saving" | "success" | "error">("ready");
  const [uid, setUid] = useState("");
  const [holderName, setHolderName] = useState("");
  const [role, setRole] = useState("Staff IT");
  const [errorMsg, setErrorMsg] = useState("");
  const [nfcScanning, setNfcScanning] = useState(false);

  const nfcRef = useRef<NfcScannerService | null>(null);

  useEffect(() => {
    if (!open) {
      if (nfcRef.current) {
        nfcRef.current.stopScan();
        nfcRef.current = null;
      }
      setStage("ready");
      setUid("");
      setHolderName("");
      setRole("Staff IT");
      setErrorMsg("");
      setNfcScanning(false);
      return;
    }

    if (isWebNfcSupported()) {
      const scanner = new NfcScannerService();
      nfcRef.current = scanner;
      scanner
        .startScan(
          (result) => {
            if (result.serialNumber) {
              sound.playDetected();
              setUid(result.serialNumber);
              setStage("detected");
            }
          },
          (err) => {
            console.warn("Register NFC error:", err);
          }
        )
        .then((started) => {
          if (started) setNfcScanning(true);
        });
    }

    return () => {
      if (nfcRef.current) {
        nfcRef.current.stopScan();
      }
    };
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) return;

    setStage("saving");
    setErrorMsg("");

    try {
      await addCard({
        uid: uid.trim(),
        holderName: holderName.trim() || "Anggota Tim",
        role: role.trim() || "Staff",
      });

      sound.playSuccess();
      setStage("success");
      onCardAdded();

      setTimeout(() => {
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      sound.playDenied();
      setStage("error");
      setErrorMsg(err?.message || "Gagal mendaftarkan kartu RFID.");
    }
  };

  const animStatus =
    stage === "success"
      ? "success"
      : stage === "error"
      ? "denied"
      : stage === "detected" || stage === "saving"
      ? "detected"
      : "idle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-border/80 p-6 text-foreground sm:rounded-3xl shadow-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-primary border border-emerald-500/20 mb-2 shadow-xs">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Daftarkan Kartu RFID Baru</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tempelkan kartu RFID/NFC ke bodi belakang ponsel Anda. Nomor UID akan otomatis terisi dan siap digunakan.
          </DialogDescription>
        </DialogHeader>

        {/* Clean Minimalist Tap Animation */}
        <PhoneCardTapAnimation
          status={animStatus}
          cardUid={uid || undefined}
          holderName={holderName || "Kartu Baru"}
        />

        {/* Input Form */}
        <form onSubmit={handleSave} className="mt-2 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-primary" /> Nomor UID Kartu RFID <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={uid}
              onChange={(e) => {
                setUid(e.target.value.toUpperCase());
                if (e.target.value) setStage("detected");
              }}
              placeholder="Tempel kartu RFID di sini..."
              className="w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 font-mono text-sm tracking-wider text-foreground outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                <User className="h-3.5 w-3.5 text-primary" /> Nama Pemilik
              </label>
              <input
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="cth. Budi Santoso"
                className="w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                <Briefcase className="h-3.5 w-3.5 text-primary" /> Peran / Divisi
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="cth. Staff IT / Direktur"
                className="w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {stage === "success" ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-500/30 py-3 text-sm font-bold text-emerald-700">
              <Check className="h-4 w-4 text-emerald-600" /> Kartu RFID Berhasil Ditambahkan!
            </div>
          ) : (
            <button
              type="submit"
              disabled={!uid.trim() || stage === "saving"}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
            >
              {stage === "saving" ? "Menyimpan ke Cloud..." : "Daftarkan Kartu Sekarang"}
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

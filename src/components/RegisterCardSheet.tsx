import React, { useEffect, useState, useRef } from "react";
import { isWebNfcSupported, NfcScannerService } from "@/lib/nfc";
import { addCard } from "@/lib/rfid";
import { sound } from "@/lib/sound";
import {
  Radio,
  CheckCircle2,
  Loader2,
  X,
  User,
  MapPin,
  Heart,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Smartphone,
} from "lucide-react";

interface RegisterCardSheetProps {
  open: boolean;
  onClose: () => void;
  onCardAdded: () => void;
}

type Step = "TAP_INITIAL" | "FILL_DATA" | "TAP_CONFIRM" | "SUCCESS";

export function RegisterCardSheet({
  open,
  onClose,
  onCardAdded,
}: RegisterCardSheetProps) {
  const [step, setStep] = useState<Step>("TAP_INITIAL");
  const [scannedUid, setScannedUid] = useState("");
  const [formData, setFormData] = useState({
    holderName: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
    role: "Pemilik Akun",
    city: "Jakarta",
    bloodType: "O",
    notes: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [nfcActive, setNfcActive] = useState(false);

  const nfcRef = useRef<NfcScannerService | null>(null);

  // Activate Web NFC Scanner whenever modal is on a tap step
  useEffect(() => {
    if (!open) {
      if (nfcRef.current) {
        nfcRef.current.stopScan();
        nfcRef.current = null;
      }
      setStep("TAP_INITIAL");
      setScannedUid("");
      setErrorMessage("");
      setIsBusy(false);
      setNfcActive(false);
      return;
    }

    const startNfc = async () => {
      if (isWebNfcSupported()) {
        const scanner = new NfcScannerService();
        nfcRef.current = scanner;

        const started = await scanner.startScan(
          (result) => {
            if (result.serialNumber) {
              handleNfcScanned(result.serialNumber);
            }
          },
          (err) => {
            console.warn("NFC register scan error:", err.message);
          }
        );

        if (started) setNfcActive(true);
      }
    };

    void startNfc();

    return () => {
      if (nfcRef.current) {
        nfcRef.current.stopScan();
      }
    };
  }, [open, step]);

  const handleNfcScanned = (uid: string) => {
    sound.playDetected();
    setErrorMessage("");

    if (step === "TAP_INITIAL") {
      setScannedUid(uid);
      sound.playSuccess();
      setStep("FILL_DATA");
    } else if (step === "TAP_CONFIRM") {
      if (scannedUid && uid !== scannedUid) {
        sound.playDenied();
        setErrorMessage("Kartu yang ditempelkan berbeda dengan kartu pertama!");
        return;
      }
      void finalizeRegistration();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.holderName.trim()) {
      setErrorMessage("Nama pemilik kartu wajib diisi!");
      return;
    }
    setErrorMessage("");
    setStep("TAP_CONFIRM");
  };

  const finalizeRegistration = async () => {
    setIsBusy(true);
    try {
      await addCard({
        uid: scannedUid,
        holderName: formData.holderName.trim(),
        role: formData.role.trim(),
        gender: formData.gender,
        city: formData.city.trim(),
        bloodType: formData.bloodType.trim(),
        notes: formData.notes.trim(),
      });

      sound.playSuccess();
      setStep("SUCCESS");
      onCardAdded();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      sound.playDenied();
      setErrorMessage(err?.message || "Gagal mendaftarkan kartu RFID.");
    } finally {
      setIsBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Clean Bottom Sheet Container */}
      <div className="w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] border border-border bg-white p-6 shadow-2xl transition-all duration-300 animate-slide-up max-h-[92dvh] overflow-y-auto">
        {/* Header with Title & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">
                Registrasi Kartu RFID Baru
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {step === "TAP_INITIAL" && "Langkah 1: Tempel Kartu Pertama"}
                {step === "FILL_DATA" && "Langkah 2: Lengkapi Data Kartu"}
                {step === "TAP_CONFIRM" && "Langkah 3: Tempel Kartu Konfirmasi"}
                {step === "SUCCESS" && "Selesai: Kartu Terdaftar"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive font-medium animate-in fade-in">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: INITIAL TAP */}
        {step === "TAP_INITIAL" && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="relative flex h-24 w-24 items-center justify-center mb-4">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400/20 duration-1000" />
              <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 shadow-xs">
                <Smartphone className="h-9 w-9 text-emerald-600 animate-bounce" />
              </div>
            </div>

            <h4 className="text-base font-extrabold text-foreground">
              Tempelkan Kartu RFID
            </h4>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              Dekatkan kartu RFID Anda ke bagian belakang ponsel untuk membaca nomor seri chip kartu secara otomatis.
            </p>

            <div className="mt-4 flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-500/20 px-3.5 py-1 text-[11px] font-semibold text-emerald-800">
              <Radio className="h-3 w-3 text-emerald-600 animate-pulse" />
              <span>{nfcActive ? "Sensor NFC HP Aktif" : "Menunggu Sensor NFC..."}</span>
            </div>
          </div>
        )}

        {/* STEP 2: FILL DATA */}
        {step === "FILL_DATA" && (
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5">
            {/* Scanned UID Badge */}
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-500/20 px-3.5 py-2">
              <span className="text-xs font-semibold text-emerald-800">UID Kartu RFID:</span>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                {scannedUid}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                <User className="h-3.5 w-3.5 text-primary" /> Nama Pemilik Kartu *
              </label>
              <input
                required
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                placeholder="cth. Budi Santoso"
                autoFocus
                className="w-full rounded-2xl border border-input bg-slate-50/70 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full rounded-2xl border border-input bg-slate-50/70 px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition cursor-pointer"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1 mb-1">
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> Gol. Darah
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full rounded-2xl border border-input bg-slate-50/70 px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition cursor-pointer"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Kota Domisili
                </label>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="cth. Jakarta"
                  className="w-full rounded-2xl border border-input bg-slate-50/70 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1 mb-1">
                  <Briefcase className="h-3.5 w-3.5 text-primary" /> Peran / Status
                </label>
                <input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="cth. Pemilik Akun"
                  className="w-full rounded-2xl border border-input bg-slate-50/70 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 transition cursor-pointer mt-2"
            >
              <span>Lanjut ke Konfirmasi Tap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {/* STEP 3: CONFIRM TAP */}
        {step === "TAP_CONFIRM" && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="relative flex h-24 w-24 items-center justify-center mb-4">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400/25 duration-1000" />
              <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 shadow-xs">
                <Loader2 className="h-9 w-9 text-emerald-600 animate-spin" />
              </div>
            </div>

            <h4 className="text-base font-extrabold text-foreground">
              Tempelkan Kartu RFID Kembali
            </h4>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-[250px] leading-relaxed">
              Tempelkan kembali kartu <span className="font-bold text-foreground">{formData.holderName}</span> ({scannedUid}) untuk mengonfirmasi penulisan hak akses ke sistem.
            </p>

            <button
              type="button"
              onClick={finalizeRegistration}
              disabled={isBusy}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isBusy ? "Menyimpan Data..." : "Konfirmasi & Simpan Kartu"}</span>
            </button>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "SUCCESS" && (
          <div className="flex flex-col items-center text-center py-6 animate-in zoom-in-95">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <h4 className="text-lg font-extrabold text-foreground">
              Kartu RFID Berhasil Didaftarkan!
            </h4>
            <p className="mt-1 text-xs text-emerald-700 font-semibold">
              {formData.holderName} ({scannedUid})
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Kartu kini siap digunakan untuk membuka brankas akun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

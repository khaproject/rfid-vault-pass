import { useNavigate } from "react-router-dom";
import { Shield, Radio, KeyRound, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { setCardSession } from "@/lib/admin-auth";
import { tapCard, ensureDemoAccountsIfEmpty } from "@/lib/rfid";
import { isWebNfcSupported, NfcScannerService } from "@/lib/nfc";
import { sound } from "@/lib/sound";
import { PhoneCardTapAnimation } from "@/components/PhoneCardTapAnimation";
import { RfidVerificationSheet } from "@/components/RfidVerificationSheet";

type SheetStage =
  | "scanning"
  | "processing"
  | "success"
  | "not_detected"
  | "not_registered"
  | "inactive"
  | "error";

export function TapPage() {
  const navigate = useNavigate();
  const [nfcActive, setNfcActive] = useState(false);

  // Verification Bottom Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStage, setSheetStage] = useState<SheetStage>("scanning");
  const [verifiedName, setVerifiedName] = useState("");
  const [verifiedRole, setVerifiedRole] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const nfcScannerRef = useRef<NfcScannerService | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    document.title = "RFID VAULT PASS — Brankas Password Pribadi";
    void ensureDemoAccountsIfEmpty();

    return () => {
      if (nfcScannerRef.current) {
        nfcScannerRef.current.stopScan();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /** Start Smart 10-Second RFID Listening Session when User triggers */
  const handleStartRfidVerification = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    sound.playDetected();
    setSheetStage("scanning");
    setCountdown(10);
    setSheetOpen(true);

    let secondsLeft = 10;
    let cardReceived = false;

    // Start NFC scanner
    if (isWebNfcSupported()) {
      const scanner = new NfcScannerService();
      nfcScannerRef.current = scanner;

      await scanner.startScan(
        (result) => {
          if (result.serialNumber && !cardReceived) {
            cardReceived = true;
            if (timerRef.current) clearInterval(timerRef.current);
            void handleCardTapped(result.serialNumber);
          }
        },
        (err) => {
          console.warn("NFC scan info:", err.message);
        }
      );
      setNfcActive(true);
    }

    // 10-second countdown interval
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(timerRef.current);
        if (!cardReceived) {
          if (nfcScannerRef.current) nfcScannerRef.current.stopScan();
          sound.playDenied();
          setSheetStage("not_detected");
          setIsProcessing(false);

          setTimeout(() => {
            setSheetOpen(false);
          }, 3500);
        }
      }
    }, 1000);
  };

  /** Process scanned RFID card */
  async function handleCardTapped(rawUid: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (nfcScannerRef.current) nfcScannerRef.current.stopScan();

    sound.playDetected();
    setSheetStage("processing");

    try {
      const result = await tapCard(rawUid);

      if (result.ok) {
        sound.playSuccess();
        setVerifiedName(result.card.holderName);
        setVerifiedRole(result.card.role);
        setSheetStage("success");

        setCardSession({
          uid: result.card.uid,
          holderName: result.card.holderName,
          role: result.card.role,
        });

        setTimeout(() => {
          setSheetOpen(false);
          setTimeout(() => {
            navigate("/vault");
          }, 300);
        }, 1400);
      } else {
        sound.playDenied();
        if (result.reason === "unknown") {
          setSheetStage("not_registered");
        } else {
          setSheetStage("inactive");
        }

        setTimeout(() => {
          setSheetOpen(false);
          setIsProcessing(false);
        }, 3000);
      }
    } catch {
      sound.playDenied();
      setSheetStage("not_registered");
      setTimeout(() => {
        setSheetOpen(false);
        setIsProcessing(false);
      }, 3000);
    }
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden flex flex-col justify-between items-center px-5 py-6 select-none bg-gradient-to-b from-background via-background/95 to-emerald-50/30">
      {/* Top Clean Minimalist Header */}
      <header className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-foreground">
            RFID VAULT PASS
          </span>
        </div>

        {/* Admin Link */}
        <button
          type="button"
          onClick={() => navigate("/admin")}
          title="Panel Pengelola Kartu"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-slate-50 transition cursor-pointer shadow-2xs"
        >
          <KeyRound className="h-4 w-4 text-slate-600" />
        </button>
      </header>

      {/* Center 100dvh Locked Presentation */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto text-center">
        {/* Interactive Phone NFC Animation */}
        <PhoneCardTapAnimation
          status={sheetStage === "success" ? "success" : isProcessing ? "scanning" : "idle"}
        />

        {/* Status indicator pill */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-800 shadow-2xs">
          <Radio className={`h-3.5 w-3.5 ${nfcActive ? "text-emerald-600 animate-pulse" : "text-emerald-500"}`} />
          <span>{nfcActive ? "NFC HP Aktif — Siap Tempel Kartu RFID" : "Sensor RFID Siap Digunakan"}</span>
        </div>

        {/* Typography Title & Description */}
        <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">
          RFID Password Vault
        </h1>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed px-2">
          Perlu verifikasi menggunakan kartu RFID terlebih dahulu. Tekan tombol di bawah lalu tempelkan kartu RFID Anda ke bodi ponsel untuk membuka brankas akun.
        </p>

        {/* Main Clean Tap Action Button */}
        <div className="mt-6 w-full">
          <button
            type="button"
            onClick={handleStartRfidVerification}
            disabled={isProcessing}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/95 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Tempelkan Kartu RFID</span>
          </button>
        </div>
      </div>

      {/* Bottom Minimal Hint */}
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] text-muted-foreground/80 font-medium">
          Otentikasi Kunci Fisik RFID Terenkripsi
        </p>
      </div>

      {/* Smart RFID Verification Bottom Sheet */}
      <RfidVerificationSheet
        open={sheetOpen}
        stage={sheetStage}
        holderName={verifiedName}
        role={verifiedRole}
        countdown={countdown}
        onClose={() => {
          if (timerRef.current) clearInterval(timerRef.current);
          if (nfcScannerRef.current) nfcScannerRef.current.stopScan();
          setSheetOpen(false);
          setIsProcessing(false);
        }}
      />
    </main>
  );
}

export default TapPage;

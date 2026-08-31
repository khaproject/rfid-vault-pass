import React from "react";
import { Smartphone, Radio, CheckCircle2, XCircle } from "lucide-react";

interface PhoneCardTapAnimationProps {
  status: "idle" | "scanning" | "detected" | "success" | "denied";
  cardUid?: string;
  holderName?: string;
}

export function PhoneCardTapAnimation({
  status,
  cardUid,
  holderName,
}: PhoneCardTapAnimationProps) {
  return (
    <div className="relative mx-auto flex flex-col items-center justify-center select-none py-1">
      {/* Visual Ambient Field - Phone centered without floating card */}
      <div className="relative flex h-60 w-60 items-center justify-center">
        {/* Soft Concentric NFC Waves */}
        <div
          className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
            status === "scanning"
              ? "h-52 w-52 bg-emerald-500/10 border border-emerald-500/30 animate-ping duration-1000"
              : status === "detected" || status === "success"
              ? "h-56 w-56 bg-emerald-500/15 border border-emerald-500/40 scale-100"
              : status === "denied"
              ? "h-56 w-56 bg-rose-500/10 border border-rose-500/30"
              : "h-44 w-44 bg-teal-500/5 border border-teal-500/15 animate-pulse"
          }`}
        />

        <div
          className={`absolute rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
            status === "scanning"
              ? "h-40 w-40 border-emerald-500/40 animate-spin"
              : status === "success"
              ? "h-44 w-44 border-emerald-500/60"
              : status === "denied"
              ? "h-44 w-44 border-rose-400"
              : "h-32 w-32 border-teal-500/20"
          }`}
        />

        {/* Minimalist Ceramic White Smartphone - Centered */}
        <div
          className={`relative z-10 flex h-48 w-28 flex-col items-center justify-between rounded-[28px] border-2 border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/60 transition-all duration-500 ${
            status === "scanning"
              ? "scale-105"
              : status === "success"
              ? "scale-105 border-emerald-500/40"
              : "scale-100"
          }`}
        >
          {/* Top Speaker notch */}
          <div className="flex h-1.5 w-8 items-center justify-center rounded-full bg-slate-200">
            <div className="h-1 w-1 rounded-full bg-slate-400" />
          </div>

          {/* Screen Content */}
          <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 px-1 py-2 text-center">
            {/* NFC Wave indicator header */}
            <div className="absolute top-2 flex items-center gap-1 text-[9px] font-medium tracking-wide text-primary">
              <Radio className={`h-3 w-3 ${status === "scanning" ? "animate-pulse" : ""}`} />
              <span>RFID / NFC</span>
            </div>

            {/* Status indicator on screen */}
            <div className="mt-3 flex flex-col items-center">
              {status === "idle" && (
                <div className="flex flex-col items-center gap-1.5">
                  <Smartphone className="h-6 w-6 text-slate-400 animate-bounce" />
                  <span className="text-[9.5px] font-medium text-slate-500">
                    Tempel Kartu
                  </span>
                </div>
              )}

              {status === "scanning" && (
                <div className="flex flex-col items-center gap-1">
                  <div className="relative flex h-7 w-7 items-center justify-center">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                    <Radio className="relative h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-[9px] text-emerald-700 font-semibold animate-pulse">
                    Membaca...
                  </span>
                </div>
              )}

              {(status === "detected" || status === "success") && (
                <div className="flex flex-col items-center gap-0.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 animate-bounce" />
                  <span className="text-[9.5px] font-bold text-emerald-700">
                    {status === "success" ? "TERVERIFIKASI" : "TERBACA"}
                  </span>
                  {cardUid && (
                    <span className="font-mono text-[8px] text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded font-semibold">
                      {cardUid.slice(0, 8)}
                    </span>
                  )}
                </div>
              )}

              {status === "denied" && (
                <div className="flex flex-col items-center gap-0.5">
                  <XCircle className="h-6 w-6 text-rose-500 animate-shake" />
                  <span className="text-[9px] font-bold text-rose-600">DITOLAK</span>
                </div>
              )}
            </div>
          </div>

          {/* Home indicator */}
          <div className="h-0.5 w-8 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
}

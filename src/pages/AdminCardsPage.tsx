import { useNavigate } from "react-router-dom";
import {
  Shield,
  CreditCard,
  Plus,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  LogOut,
  History,
  CheckCircle2,
  XCircle,
  Users,
  Radio,
  MapPin,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { clearAdminSession, hasAdminSession } from "@/lib/admin-auth";
import {
  deleteCard,
  setCardActive,
  subscribeCards,
  subscribeLogs,
  normalizeUid,
  type AccessLog,
  type Card,
} from "@/lib/rfid";
import { sound } from "@/lib/sound";
import { RegisterCardSheet } from "@/components/RegisterCardSheet";

function timeAgo(ts?: number | null) {
  if (!ts) return "Belum pernah";
  return new Date(ts).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

export function AdminCardsPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    document.title = "Kelola Kartu RFID — RFID VAULT PASS";
    if (!hasAdminSession()) {
      void navigate("/admin");
      return;
    }
    setReady(true);
    const offCards = subscribeCards(setCards);
    const offLogs = subscribeLogs(setLogs);
    return () => {
      offCards();
      offLogs();
    };
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = normalizeUid(search);
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.uid.includes(q) ||
        c.holderName.toUpperCase().includes(search.trim().toUpperCase()) ||
        (c.city && c.city.toUpperCase().includes(search.trim().toUpperCase()))
    );
  }, [cards, search]);

  const activeCount = cards.filter((c) => c.active).length;

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-background pb-16 flex flex-col items-center">
      {/* Admin Top Navigation */}
      <header className="w-full border-b border-border/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">RFID VAULT PASS</p>
              <p className="text-[11px] text-muted-foreground font-medium">
                {cards.length} Kartu Terdaftar · {activeCount} Aktif
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              clearAdminSession();
              sound.playSuccess();
              void navigate("/admin");
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-rose-600 transition cursor-pointer shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>
      </header>

      <div className="w-full max-w-lg space-y-5 px-4 py-5">
        {/* Banner CTA to Register via 3-step bottom sheet */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold px-2.5 py-0.5 mb-1.5">
                <Radio className="h-3 w-3 text-emerald-600" /> Registrasi 3-Langkah
              </span>
              <h1 className="text-lg font-extrabold text-foreground">
                Tambah Kartu RFID
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[240px] leading-relaxed">
                Tempel kartu &rarr; Lengkapi identitas &rarr; Tempel konfirmasi.
              </p>
            </div>

            <button
              onClick={() => setSheetOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/95 active:scale-95 transition cursor-pointer"
              title="Daftarkan Kartu Baru"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* 3-Step Registration Bottom Sheet Modal */}
        <RegisterCardSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onCardAdded={() => {}}
        />

        {/* Registered Cards Section */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> Daftar Kartu Terdaftar ({filtered.length})
            </h2>

            <div className="relative w-44">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama/UID..."
                className="w-full rounded-full border border-input bg-white py-1.5 pl-8 pr-3 text-xs text-foreground outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center shadow-xs">
              <CreditCard className="mx-auto h-7 w-7 text-muted-foreground/60" />
              <p className="mt-2 text-xs font-bold text-foreground">Tidak ada kartu yang ditemukan</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Silakan daftarkan kartu RFID pertama Anda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((card) => (
                <div
                  key={card.uid}
                  className="rounded-3xl border border-border/90 bg-white p-4.5 shadow-xs transition hover:border-primary/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                          {card.uid}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            card.active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {card.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <h3 className="mt-2 text-base font-extrabold text-foreground">
                        {card.holderName}
                      </h3>

                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span>Peran: <strong className="text-foreground">{card.role}</strong></span>
                        {card.gender && <span>· Gender: <strong className="text-foreground">{card.gender}</strong></span>}
                        {card.bloodType && <span>· Gol: <strong className="text-foreground">{card.bloodType}</strong></span>}
                        {card.city && (
                          <span className="flex items-center gap-0.5">
                            · <MapPin className="h-3 w-3 text-primary" /> {card.city}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-[10.5px] text-muted-foreground">
                        Terakhir digunakan: {timeAgo(card.lastSeenAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => {
                          void setCardActive(card.uid, !card.active);
                          sound.playSuccess();
                        }}
                        className="p-1 text-muted-foreground hover:text-primary transition cursor-pointer"
                        title={card.active ? "Nonaktifkan Kartu" : "Aktifkan Kartu"}
                      >
                        {card.active ? (
                          <ToggleRight className="h-5 w-5 text-primary" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>

                      <button
                        aria-label="Hapus kartu"
                        onClick={() => {
                          if (confirm(`Hapus kartu ${card.uid} (${card.holderName})?`)) {
                            void deleteCard(card.uid);
                            sound.playSuccess();
                          }
                        }}
                        className="p-1 text-muted-foreground hover:text-rose-600 transition cursor-pointer"
                        title="Hapus Kartu"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Real-Time Access Activity Logs */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-primary" /> Riwayat Tap Terakhir
          </h2>

          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-4 text-center text-xs text-muted-foreground">
              Belum ada riwayat tap.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-2xs">
              <ul className="divide-y divide-border/60">
                {logs.slice(0, 5).map((log) => (
                  <li key={log.id} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      {log.result === "granted" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <span className="font-mono font-bold text-foreground text-[11px]">{log.uid}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9.5px] font-bold ${
                          log.result === "granted"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {log.result === "granted" ? "Diterima" : "Ditolak"}
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(log.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminCardsPage;

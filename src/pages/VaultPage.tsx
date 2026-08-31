import { useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  Plus,
  Trash2,
  X,
  Search,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Lock,
  Mail,
  Smartphone,
  Server,
  Layers,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";

import { clearCardSession, getCardSession, type CardSession } from "@/lib/admin-auth";
import {
  deleteAccount,
  saveAccount,
  subscribeAccounts,
  ensureDemoAccountsIfEmpty,
  type AccountItem,
} from "@/lib/rfid";
import { sound } from "@/lib/sound";

const CATEGORIES = [
  { id: "all", label: "Semua Akun" },
  { id: "Email & Kerja", label: "Email & Kerja" },
  { id: "Perbankan & Keuangan", label: "Keuangan" },
  { id: "Kredensial Server", label: "Server" },
  { id: "Media Sosial", label: "Sosmed" },
];

export function VaultPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CardSession | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswordIds, setShowPasswordIds] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<{
    appName: string;
    category: AccountItem["category"];
    username: string;
    password: string;
    emailOrPhone: string;
    pinOr2fa: string;
    websiteUrl: string;
    notes: string;
  }>({
    appName: "",
    category: "Email & Kerja",
    username: "",
    password: "",
    emailOrPhone: "",
    pinOr2fa: "",
    websiteUrl: "",
    notes: "",
  });

  useEffect(() => {
    document.title = "Daftar Akun Pribadi — AURA PASS";
    const current = getCardSession();
    if (!current) {
      void navigate("/");
      return;
    }
    setSession(current);
    void ensureDemoAccountsIfEmpty();
    return subscribeAccounts(setAccounts);
  }, [navigate]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchCat =
        activeCategory === "all" ||
        acc.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch =
        !search.trim() ||
        acc.appName.toLowerCase().includes(search.toLowerCase()) ||
        acc.username.toLowerCase().includes(search.toLowerCase()) ||
        (acc.emailOrPhone && acc.emailOrPhone.toLowerCase().includes(search.toLowerCase())) ||
        acc.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [accounts, activeCategory, search]);

  const handleCopy = (uniqueKey: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(uniqueKey);
    sound.playSuccess();
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswordIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.appName.trim() || !form.username.trim() || !form.password.trim()) return;

    await saveAccount(form);
    sound.playSuccess();
    setForm({
      appName: "",
      category: "Email & Kerja",
      username: "",
      password: "",
      emailOrPhone: "",
      pinOr2fa: "",
      websiteUrl: "",
      notes: "",
    });
    setModalOpen(false);
  };

  if (!session) return null;

  return (
    <main className="min-h-screen bg-background pb-12 flex flex-col items-center">
      {/* Top Mobile Header */}
      <header className="w-full border-b border-border/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">Brankas Password</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {session.holderName} ({session.role})
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              clearCardSession();
              sound.playSuccess();
              void navigate("/");
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-rose-600 hover:border-rose-200 transition cursor-pointer shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Kunci
          </button>
        </div>
      </header>

      {/* Main Content Responsive Container */}
      <div className="w-full max-w-lg px-4 py-5 space-y-5">
        {/* Profile Card Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[10.5px] font-bold px-2.5 py-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> RFID Verified
              </span>
              <h1 className="mt-1.5 text-xl font-extrabold text-foreground">
                Informasi Akun Penting
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {accounts.length} Akun & Password tersimpan aman
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/95 active:scale-95 transition cursor-pointer"
              title="Tambah Akun Baru"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Search & Category Filter Pills */}
        <section className="space-y-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama aplikasi, username, atau email..."
              className="w-full rounded-2xl border border-input bg-white py-2.5 pl-9 pr-4 text-xs text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition shadow-2xs"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "border border-border bg-white text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Accounts List (No empty look, full info card) */}
        <section className="space-y-3.5">
          {filteredAccounts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-white/70 p-10 text-center shadow-xs">
              <Lock className="mx-auto h-7 w-7 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-bold text-foreground">
                Tidak ada akun yang ditemukan
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Klik tombol '+' di atas untuk menambahkan akun baru.
              </p>
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isRevealed = !!showPasswordIds[acc.id];
              return (
                <div
                  key={acc.id}
                  className="rounded-3xl border border-border/90 bg-white p-4.5 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
                >
                  {/* Account Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {acc.category}
                      </span>
                      <h2 className="text-base font-extrabold text-foreground mt-1">
                        {acc.appName}
                      </h2>
                    </div>

                    <button
                      aria-label="Hapus Akun"
                      onClick={() => {
                        if (confirm(`Hapus data akun "${acc.appName}"?`)) {
                          void deleteAccount(acc.id);
                          sound.playSuccess();
                        }
                      }}
                      className="rounded-xl p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Username / Login ID Field */}
                  <div className="mt-3.5 space-y-2 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Username / ID:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground select-all">
                          {acc.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`user-${acc.id}`, acc.username)}
                          className="rounded-lg p-1 text-muted-foreground hover:text-primary transition cursor-pointer"
                          title="Salin Username"
                        >
                          {copiedKey === `user-${acc.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Password:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-800 tracking-wider">
                          {isRevealed ? acc.password : "••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(acc.id)}
                          className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
                          title={isRevealed ? "Sembunyikan" : "Tampilkan"}
                        >
                          {isRevealed ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(`pass-${acc.id}`, acc.password)}
                          className="rounded-lg p-1 text-muted-foreground hover:text-primary transition cursor-pointer"
                          title="Salin Password"
                        >
                          {copiedKey === `pass-${acc.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Email / Phone if provided */}
                    {acc.emailOrPhone && (
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                        <span className="text-muted-foreground font-semibold">
                          Email / No HP:
                        </span>
                        <span className="font-medium text-foreground">
                          {acc.emailOrPhone}
                        </span>
                      </div>
                    )}

                    {/* 2FA / PIN if provided */}
                    {acc.pinOr2fa && (
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                        <span className="text-muted-foreground font-semibold">
                          PIN / 2FA:
                        </span>
                        <span className="font-mono font-medium text-foreground bg-emerald-100/60 px-1.5 py-0.5 rounded">
                          {acc.pinOr2fa}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Website footer if exists */}
                  {(acc.notes || acc.websiteUrl) && (
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                      <span className="truncate max-w-[200px] italic">
                        {acc.notes || ""}
                      </span>
                      {acc.websiteUrl && (
                        <a
                          href={acc.websiteUrl.startsWith("http") ? acc.websiteUrl : `https://${acc.websiteUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          Buka Web <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* Add New Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 px-0 sm:px-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-border bg-white p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-foreground">
                  Tambah Akun Password Baru
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Aplikasi / Layanan *</label>
                <input
                  required
                  value={form.appName}
                  onChange={(e) => setForm({ ...form, appName: e.target.value })}
                  placeholder="cth. Google Utama, BCA Mobile, GitHub"
                  className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition cursor-pointer"
                  >
                    <option value="Email & Kerja">Email & Kerja</option>
                    <option value="Perbankan & Keuangan">Perbankan & Keuangan</option>
                    <option value="Kredensial Server">Kredensial Server</option>
                    <option value="Media Sosial">Media Sosial</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Username / ID *</label>
                  <input
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="cth. user@email.com"
                    className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Password Rahasia *</label>
                  <input
                    required
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Ketik password"
                    className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">PIN / Kode 2FA</label>
                  <input
                    value={form.pinOr2fa}
                    onChange={(e) => setForm({ ...form, pinOr2fa: e.target.value })}
                    placeholder="cth. PIN 6-digit / OTP"
                    className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Email Pemulihan / No HP</label>
                  <input
                    value={form.emailOrPhone}
                    onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
                    placeholder="+62812..."
                    className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Link Website</label>
                  <input
                    value={form.websiteUrl}
                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan keamanan khusus..."
                  className="mt-1 w-full rounded-2xl border border-input bg-slate-50/60 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/95 cursor-pointer mt-2"
              >
                Simpan Akun ke Brankas
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default VaultPage;

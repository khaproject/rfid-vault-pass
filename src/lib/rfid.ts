import {
  ref,
  get,
  set,
  update,
  remove,
  push,
  query,
  limitToLast,
  onValue,
} from "firebase/database";

import { getDb } from "./firebase";

export type Card = {
  uid: string;
  holderName: string;
  role: string;
  gender?: "Laki-laki" | "Perempuan" | "Lainnya";
  city?: string;
  bloodType?: string;
  notes?: string;
  active: boolean;
  createdAt: number;
  lastSeenAt?: number | null;
};

export type AccountItem = {
  id: string;
  appName: string;
  category: "Email & Kerja" | "Perbankan & Keuangan" | "Media Sosial" | "Kredensial Server" | "Lainnya";
  username: string;
  password: string;
  emailOrPhone?: string;
  pinOr2fa?: string;
  websiteUrl?: string;
  notes?: string;
  updatedAt: number;
};

export type AccessLog = {
  id: string;
  uid: string;
  result: "granted" | "denied" | "inactive";
  at: number;
};

export function normalizeUid(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** RTDB keys cannot contain . # $ [ ] / */
export function uidKey(uid: string) {
  return normalizeUid(uid).replace(/[.#$[\]/]/g, "-");
}

/* LocalStorage Cache Keys */
const LS_CARDS_KEY = "rfid_vault.cards";
const LS_ACCOUNTS_KEY = "rfid_vault.accounts";

export function getLocalCards(): Card[] {
  try {
    const raw = localStorage.getItem(LS_CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalAccounts(): AccountItem[] {
  try {
    const raw = localStorage.getItem(LS_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCards(cards: Card[]) {
  try {
    localStorage.setItem(LS_CARDS_KEY, JSON.stringify(cards));
  } catch {}
}

export function saveLocalAccounts(accs: AccountItem[]) {
  try {
    localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accs));
  } catch {}
}

/** Helper timeout promise */
function timeoutPromise<T>(ms: number, fallback: () => Promise<T>): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      resolve(await fallback());
    }, ms);
  });
}

export function subscribeCards(cb: (cards: Card[]) => void) {
  cb(getLocalCards());

  try {
    return onValue(
      ref(getDb(), "cards"),
      (snap) => {
        if (snap.exists()) {
          const val = snap.val() as Record<string, Card>;
          const list = Object.values(val).sort(
            (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
          );
          saveLocalCards(list);
          cb(list);
        } else {
          saveLocalCards([]);
          cb([]);
        }
      },
      () => {
        cb(getLocalCards());
      }
    );
  } catch {
    cb(getLocalCards());
    return () => {};
  }
}

export function subscribeAccounts(cb: (accounts: AccountItem[]) => void) {
  cb(getLocalAccounts());

  try {
    return onValue(
      ref(getDb(), "accounts"),
      (snap) => {
        if (snap.exists()) {
          const val = snap.val() as Record<string, Omit<AccountItem, "id">>;
          const list = Object.entries(val).map(([id, r]) => ({
            id,
            appName: r.appName || "Akun Penting",
            category: r.category || "Lainnya",
            username: r.username || "",
            password: r.password || "",
            emailOrPhone: r.emailOrPhone || "",
            pinOr2fa: r.pinOr2fa || "",
            websiteUrl: r.websiteUrl || "",
            notes: r.notes || "",
            updatedAt: r.updatedAt || Date.now(),
          }));
          const sorted = list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
          saveLocalAccounts(sorted);
          cb(sorted);
        } else {
          saveLocalAccounts([]);
          cb([]);
        }
      },
      () => {
        cb(getLocalAccounts());
      }
    );
  } catch {
    cb(getLocalAccounts());
    return () => {};
  }
}

export function subscribeLogs(cb: (logs: AccessLog[]) => void) {
  try {
    return onValue(
      query(ref(getDb(), "accessLogs"), limitToLast(20)),
      (snap) => {
        if (snap.exists()) {
          const val = snap.val() as Record<string, Omit<AccessLog, "id">>;
          cb(
            Object.entries(val)
              .map(([id, l]) => ({ id, ...l }))
              .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
          );
        } else {
          cb([]);
        }
      },
      () => {
        cb([]);
      }
    );
  } catch {
    cb([]);
    return () => {};
  }
}

export async function getCard(uid: string): Promise<Card | null> {
  const norm = normalizeUid(uid);
  try {
    const fetchCloud = async () => {
      const snap = await get(ref(getDb(), `cards/${uidKey(norm)}`));
      return snap.exists() ? (snap.val() as Card) : null;
    };

    const cloudCard = await Promise.race([
      fetchCloud(),
      timeoutPromise<Card | null>(2500, async () => null),
    ]);

    if (cloudCard) return cloudCard;
  } catch {}

  const localCards = getLocalCards();
  return localCards.find((c) => normalizeUid(c.uid) === norm) || null;
}

export async function addCard(input: {
  uid: string;
  holderName: string;
  role: string;
  gender?: "Laki-laki" | "Perempuan" | "Lainnya";
  city?: string;
  bloodType?: string;
  notes?: string;
}) {
  const uid = normalizeUid(input.uid);
  const key = uidKey(uid);
  const card: Card = {
    uid,
    holderName: input.holderName.trim() || "Pemilik Kartu",
    role: input.role.trim() || "Pemilik Akun",
    gender: input.gender || "Laki-laki",
    city: input.city?.trim() || "Indonesia",
    bloodType: input.bloodType?.trim() || "O",
    notes: input.notes?.trim() || "",
    active: true,
    createdAt: Date.now(),
    lastSeenAt: null,
  };

  // Save to local
  const current = getLocalCards().filter((c) => normalizeUid(c.uid) !== uid);
  current.unshift(card);
  saveLocalCards(current);

  // Sync to Firebase
  try {
    await set(ref(getDb(), `cards/${key}`), card);
  } catch (err) {
    console.warn("Cloud sync deferred:", err);
  }

  return card;
}

export async function setCardActive(uid: string, active: boolean) {
  const norm = normalizeUid(uid);
  const current = getLocalCards().map((c) =>
    normalizeUid(c.uid) === norm ? { ...c, active } : c
  );
  saveLocalCards(current);

  try {
    await update(ref(getDb(), `cards/${uidKey(norm)}`), { active });
  } catch {}
}

export async function deleteCard(uid: string) {
  const norm = normalizeUid(uid);
  const current = getLocalCards().filter((c) => normalizeUid(c.uid) !== norm);
  saveLocalCards(current);

  try {
    await remove(ref(getDb(), `cards/${uidKey(norm)}`));
  } catch {}
}

export async function logAccess(uid: string, result: AccessLog["result"]) {
  try {
    await push(ref(getDb(), "accessLogs"), { uid: normalizeUid(uid), result, at: Date.now() });
  } catch {}
}

export async function touchCard(uid: string) {
  const norm = normalizeUid(uid);
  try {
    await update(ref(getDb(), `cards/${uidKey(norm)}`), { lastSeenAt: Date.now() });
  } catch {}
}

export async function tapCard(rawUid: string): Promise<
  { ok: true; card: Card } | { ok: false; reason: "unknown" | "inactive" }
> {
  const uid = normalizeUid(rawUid);
  const card = await getCard(uid);

  if (!card) {
    void logAccess(uid, "denied");
    return { ok: false, reason: "unknown" };
  }

  if (!card.active) {
    void logAccess(uid, "inactive");
    return { ok: false, reason: "inactive" };
  }

  void Promise.all([logAccess(uid, "granted"), touchCard(uid)]);
  return { ok: true, card };
}

export async function saveAccount(input: {
  id?: string;
  appName: string;
  category: AccountItem["category"];
  username: string;
  password: string;
  emailOrPhone?: string;
  pinOr2fa?: string;
  websiteUrl?: string;
  notes?: string;
}) {
  const id = input.id || `acc-${Date.now()}`;
  const payload: AccountItem = {
    id,
    appName: input.appName.trim(),
    category: input.category || "Lainnya",
    username: input.username.trim(),
    password: input.password.trim(),
    emailOrPhone: input.emailOrPhone?.trim() || "",
    pinOr2fa: input.pinOr2fa?.trim() || "",
    websiteUrl: input.websiteUrl?.trim() || "",
    notes: input.notes?.trim() || "",
    updatedAt: Date.now(),
  };

  const current = getLocalAccounts().filter((a) => a.id !== id);
  current.unshift(payload);
  saveLocalAccounts(current);

  try {
    if (input.id) {
      await update(ref(getDb(), `accounts/${input.id}`), payload);
    } else {
      await push(ref(getDb(), "accounts"), payload);
    }
  } catch (err) {
    console.warn("Cloud sync account deferred:", err);
  }

  return id;
}

export async function deleteAccount(id: string) {
  const current = getLocalAccounts().filter((a) => a.id !== id);
  saveLocalAccounts(current);

  try {
    await remove(ref(getDb(), `accounts/${id}`));
  } catch {}
}

export async function ensureDemoAccountsIfEmpty() {
  // Empty clean state - ready for fresh user data
}

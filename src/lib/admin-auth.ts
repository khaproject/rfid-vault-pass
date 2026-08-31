import { ref, get, set } from "firebase/database";
import { getDb } from "./firebase";

const ADMIN_SESSION_KEY = "rfid_vault.admin";
const CARD_SESSION_KEY = "rfid_vault.card";
const LS_ADMIN_CONFIG_KEY = "rfid_vault.admin_config";

type AdminConfig = { salt: string; hash: string; updatedAt: number };

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0") + "sec";
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const combined = `${salt}:${password}`;
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.digest === "function"
  ) {
    try {
      const data = new TextEncoder().encode(combined);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return toHex(digest);
    } catch {
      return simpleHash(combined);
    }
  }
  return simpleHash(combined);
}

function randomSalt() {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.getRandomValues === "function") {
    try {
      return toHex(window.crypto.getRandomValues(new Uint8Array(16)).buffer);
    } catch {}
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getLocalAdminConfig(): AdminConfig | null {
  try {
    const raw = localStorage.getItem(LS_ADMIN_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalAdminConfig(config: AdminConfig | null) {
  try {
    if (!config) {
      localStorage.removeItem(LS_ADMIN_CONFIG_KEY);
    } else {
      localStorage.setItem(LS_ADMIN_CONFIG_KEY, JSON.stringify(config));
    }
  } catch {}
}

export async function adminExists(): Promise<boolean> {
  try {
    const snap = await Promise.race([
      get(ref(getDb(), "config/admin")),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (snap && snap.exists()) {
      saveLocalAdminConfig(snap.val() as AdminConfig);
      return true;
    } else if (snap && !snap.exists()) {
      saveLocalAdminConfig(null);
      return false;
    }
  } catch {}

  return !!getLocalAdminConfig();
}

export async function createAdmin(password: string) {
  if (password.length < 6) throw new Error("Kata sandi minimal 6 karakter");
  const salt = randomSalt();
  const config: AdminConfig = {
    salt,
    hash: await hashPassword(password, salt),
    updatedAt: Date.now(),
  };

  saveLocalAdminConfig(config);

  try {
    await set(ref(getDb(), "config/admin"), config);
  } catch (err) {
    console.warn("Deferred admin cloud sync:", err);
  }
}

export async function verifyAdmin(password: string): Promise<boolean> {
  let config: AdminConfig | null = null;

  try {
    const snap = await get(ref(getDb(), "config/admin"));
    if (snap.exists()) {
      config = snap.val() as AdminConfig;
      saveLocalAdminConfig(config);
    } else {
      saveLocalAdminConfig(null);
    }
  } catch {
    config = getLocalAdminConfig();
  }

  // If no admin exists in Firebase, auto setup with this password as master
  if (!config) {
    await createAdmin(password);
    return true;
  }

  const hash = await hashPassword(password, config.salt);
  return hash === config.hash;
}

export function setAdminSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, String(Date.now()));
}
export function hasAdminSession() {
  return typeof window !== "undefined" && sessionStorage.getItem(ADMIN_SESSION_KEY) !== null;
}
export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export type CardSession = { uid: string; holderName: string; role: string };

export function setCardSession(session: CardSession) {
  sessionStorage.setItem(CARD_SESSION_KEY, JSON.stringify(session));
}
export function getCardSession(): CardSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CARD_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CardSession;
  } catch {
    return null;
  }
}
export function clearCardSession() {
  sessionStorage.removeItem(CARD_SESSION_KEY);
}

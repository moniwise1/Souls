// Accounts, sign-in, "remember me", and encrypted saving.
//
// Device accounts (default): your password never leaves the device. It is
// stretched with PBKDF2 (210,000 rounds) into a verifier and an AES-256 key,
// and your budget is stored encrypted with that key.
//
// Cloud accounts (when config.js has Supabase keys): Supabase checks the
// password and keeps one private row of data per user (row-level security, so
// only you can read it). The copy on each device stays encrypted as above.

import { CONFIG } from "../config.js";
import { uid } from "./util.js";

const ACCOUNTS = "bp.accounts";
const SESSION = "bp.session";
const REMEMBER = "bp.remember";
const dataKey = (id) => "bp.data." + id;
const ITER = 210000;
const SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

export const cloudEnabled = !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
export const aiEnabled = cloudEnabled && !!CONFIG.aiEnabled;
export let current = null; // { id, email, name, cloud, userId, key }
let sb = null;
let recoveryHandler = null;
const syncListeners = new Set();
export let syncStatus = cloudEnabled ? "idle" : "device";
const setSync = (s) => { syncStatus = s; syncListeners.forEach((f) => f(s)); };
export const onSync = (f) => syncListeners.add(f);
export const onRecovery = (f) => { recoveryHandler = f; };

/* --------------------------------------------------------- crypto -- */
const te = new TextEncoder();
const td = new TextDecoder();
function b64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const cryptoReady = !!(globalThis.crypto && crypto.subtle);

async function derive(password, salt, iter) {
  const base = await crypto.subtle.importKey("raw", te.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unb64(salt), iterations: iter }, base, 512)
  );
  return { verifier: b64(bits.slice(0, 32)), keyRaw: bits.slice(32) };
}
const importKey = (raw) => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
async function encrypt(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(text)));
  return { iv: b64(iv), ct: b64(ct) };
}
async function decrypt(key, env) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(env.iv) }, key, unb64(env.ct));
  return JSON.parse(td.decode(pt));
}
const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));

/* -------------------------------------------------------- storage -- */
function accounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS)) || {}; } catch { return {}; }
}
const saveAccounts = (a) => localStorage.setItem(ACCOUNTS, JSON.stringify(a));
const norm = (e) => String(e || "").trim().toLowerCase();
export const hasLocalAccounts = () => Object.keys(accounts()).length > 0;
export const lastEmail = () => localStorage.getItem("bp.lastEmail") || "";

function check({ email, password }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!password || password.length < 8) throw new Error("Use a password of at least 8 characters.");
}

async function startSession(acc, keyRaw, remember) {
  const keep = remember ? localStorage : sessionStorage;
  (remember ? sessionStorage : localStorage).removeItem(SESSION);
  keep.setItem(SESSION, JSON.stringify({ email: acc.email, key: b64(keyRaw) }));
  localStorage.setItem(REMEMBER, remember ? "1" : "0");
  localStorage.setItem("bp.lastEmail", acc.email);
  current = { id: acc.id, email: acc.email, name: acc.name, cloud: !!acc.cloud, userId: acc.userId, key: await importKey(keyRaw) };
  return current;
}
function clearSession() {
  localStorage.removeItem(SESSION);
  sessionStorage.removeItem(SESSION);
  current = null;
}

/* --------------------------------------------------------- cloud -- */
async function cloud() {
  if (!cloudEnabled) return null;
  if (sb) return sb;
  const { createClient } = await import(SDK);
  const remember = localStorage.getItem(REMEMBER) !== "0";
  sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "bp.sb.auth",
      storage: remember ? localStorage : sessionStorage
    }
  });
  sb.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY" && recoveryHandler) recoveryHandler();
  });
  return sb;
}
function friendly(error) {
  const m = String(error?.message || error || "");
  if (/invalid login/i.test(m)) return new Error("Wrong email or password.");
  if (/not confirmed/i.test(m)) return new Error("Confirm your email first. Check your inbox for the link.");
  if (/already registered|already exists/i.test(m)) return new Error("That email already has an account. Sign in instead.");
  if (/rate limit/i.test(m)) return new Error("Too many attempts. Wait a minute and try again.");
  if (/fetch|network/i.test(m)) return new Error("Can't reach the server. Check your internet connection.");
  return new Error(m || "Something went wrong. Try again.");
}
async function finishCloud(user, password, remember, name = "") {
  const email = norm(user.email);
  const all = accounts();
  const id = "u_" + user.id;
  let acc = all[email];
  let d;
  if (acc) {
    d = await derive(password, acc.salt, acc.iter);
    if (d.verifier !== acc.verifier) {
      // password changed elsewhere: the old device copy can't be opened, the cloud copy will be used
      acc = { ...acc, salt: newSalt(), iter: ITER };
      d = await derive(password, acc.salt, acc.iter);
      localStorage.removeItem(dataKey(acc.id));
    } else if (acc.id !== id) {
      // a device account moving to the cloud keeps its data
      const old = localStorage.getItem(dataKey(acc.id));
      if (old) localStorage.setItem(dataKey(id), old);
      localStorage.removeItem(dataKey(acc.id));
    }
  } else {
    acc = { salt: newSalt(), iter: ITER, created: Date.now() };
    d = await derive(password, acc.salt, acc.iter);
  }
  acc = { ...acc, id, email, cloud: true, userId: user.id, verifier: d.verifier, name: acc.name || name || user.user_metadata?.name || "" };
  all[email] = acc;
  saveAccounts(all);
  return startSession(acc, d.keyRaw, remember);
}

/* ------------------------------------------------------ public API -- */
export async function signUp({ name, email, password, remember }) {
  email = norm(email);
  check({ email, password });
  if (cloudEnabled) {
    const c = await cloud();
    const { data, error } = await c.auth.signUp({
      email, password, options: { data: { name }, emailRedirectTo: location.href.split(/[?#]/)[0] }
    });
    if (error) throw friendly(error);
    if (!data.session) return { needsConfirm: true };
    return finishCloud(data.user, password, remember, name);
  }
  const all = accounts();
  if (all[email]) throw new Error("This device already has an account with that email. Sign in instead.");
  const acc = { id: uid(), email, name, salt: newSalt(), iter: ITER, created: Date.now(), cloud: false };
  const d = await derive(password, acc.salt, acc.iter);
  acc.verifier = d.verifier;
  all[email] = acc;
  saveAccounts(all);
  return startSession(acc, d.keyRaw, remember);
}

export async function signIn({ email, password, remember }) {
  email = norm(email);
  if (!email || !password) throw new Error("Enter your email and password.");
  if (cloudEnabled) {
    localStorage.setItem(REMEMBER, remember ? "1" : "0");
    sb = null; // rebuild with the right storage for "remember me"
    const c = await cloud();
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw friendly(error);
    return finishCloud(data.user, password, remember);
  }
  const acc = accounts()[email];
  if (!acc) throw new Error("No account with that email on this device. Create one, or restore a backup after signing up.");
  const d = await derive(password, acc.salt, acc.iter);
  if (d.verifier !== acc.verifier) throw new Error("Wrong password. Try again.");
  return startSession(acc, d.keyRaw, remember);
}

/** Picks up a remembered sign-in. Returns the user or null. */
export async function restore() {
  if (!cryptoReady) return null;
  let s;
  try { s = JSON.parse(localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION)); } catch { s = null; }
  let offline = false;
  if (cloudEnabled) {
    try { await cloud(); } // also completes email-confirmation and password-reset links
    catch { offline = true; sb = null; }
  }
  if (!s) return null;
  const acc = accounts()[s.email];
  if (!acc) return clearSession(), null;
  if (acc.cloud && !offline) {
    const { data } = await sb.auth.getSession();
    if (!data.session) return clearSession(), null;
  }
  if (offline) setSync("offline");
  current = { id: acc.id, email: acc.email, name: acc.name, cloud: !!acc.cloud, userId: acc.userId, key: await importKey(unb64(s.key)) };
  return current;
}

export async function signOut() {
  await flush();
  if (current?.cloud && sb) await sb.auth.signOut().catch(() => {});
  clearSession();
}

export async function requestPasswordReset(email) {
  if (!cloudEnabled) return false;
  const c = await cloud();
  const { error } = await c.auth.resetPasswordForEmail(norm(email), { redirectTo: location.href.split(/[?#]/)[0] });
  if (error) throw friendly(error);
  return true;
}
/** Completes a reset link: sets the new password and signs in. */
export async function completeRecovery(password) {
  check({ email: "x@y.z", password });
  const { data, error } = await sb.auth.updateUser({ password });
  if (error) throw friendly(error);
  return finishCloud(data.user, password, localStorage.getItem(REMEMBER) !== "0");
}

export async function changePassword(oldPw, newPw, getData) {
  check({ email: "x@y.z", password: newPw });
  const all = accounts();
  const acc = all[current.email];
  const d0 = await derive(oldPw, acc.salt, acc.iter);
  if (d0.verifier !== acc.verifier) throw new Error("Your current password is wrong.");
  if (acc.cloud) {
    const { error } = await sb.auth.updateUser({ password: newPw });
    if (error) throw friendly(error);
  }
  acc.salt = newSalt();
  acc.iter = ITER;
  const d = await derive(newPw, acc.salt, acc.iter);
  acc.verifier = d.verifier;
  saveAccounts(all);
  const remember = localStorage.getItem(REMEMBER) !== "0";
  await startSession(acc, d.keyRaw, remember);
  await saveData(getData());
}

export async function deleteAccount() {
  const all = accounts();
  if (current.cloud && sb) await sb.from("budget_data").delete().eq("user_id", current.userId);
  localStorage.removeItem(dataKey(current.id));
  delete all[current.email];
  saveAccounts(all);
  if (current.cloud && sb) await sb.auth.signOut().catch(() => {});
  clearSession();
}
/** Removes a device account you can no longer open (forgotten password). */
export function forgetDeviceAccount(email) {
  const all = accounts();
  const acc = all[norm(email)];
  if (!acc) return false;
  localStorage.removeItem(dataKey(acc.id));
  delete all[norm(email)];
  saveAccounts(all);
  return true;
}

/* ---------------------------------------------------------- data -- */
export async function loadData() {
  let data = null;
  let at = 0;
  const raw = localStorage.getItem(dataKey(current.id));
  if (raw) {
    try {
      const env = JSON.parse(raw);
      data = await decrypt(current.key, env);
      at = env.at || 0;
    } catch { data = null; }
  }
  if (current.cloud && sb) {
    setSync("syncing");
    try {
      const { data: row, error } = await sb.from("budget_data").select("data, updated_at").eq("user_id", current.userId).maybeSingle();
      if (error) throw error;
      if (row && (!data || Date.parse(row.updated_at) > at)) data = row.data;
      else if (!row && data) await push(JSON.stringify(data), at || Date.now());
      setSync("synced");
    } catch { setSync("offline"); }
  }
  return data;
}

let chain = Promise.resolve();
let pushTimer = null;
let pending = null;
export function saveData(obj) {
  if (!current) return Promise.resolve();
  const json = JSON.stringify(obj);
  const at = Date.now();
  const user = current;
  chain = chain
    .then(async () => {
      const env = await encrypt(user.key, json);
      env.at = at;
      localStorage.setItem(dataKey(user.id), JSON.stringify(env));
    })
    .catch((e) => { console.error(e); setSync("error"); });
  if (user.cloud) {
    pending = { json, at };
    setSync("saving");
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(json, at), 1200);
  }
  return chain;
}
async function push(json, at) {
  if (!current?.cloud || !sb) return;
  try {
    const { error } = await sb.from("budget_data").upsert({ user_id: current.userId, data: JSON.parse(json), updated_at: new Date(at).toISOString() });
    if (error) throw error;
    if (pending?.at === at) pending = null;
    setSync("synced");
  } catch { setSync("offline"); }
}
export async function flush() {
  clearTimeout(pushTimer);
  if (pending) await push(pending.json, pending.at);
  await chain;
}
addEventListener("online", () => pending && push(pending.json, pending.at));

/* ------------------------------------------------------------ AI -- */
export async function askCloudAI(payload) {
  const c = await cloud();
  const { data, error } = await c.functions.invoke(CONFIG.aiFunction, { body: payload });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return data;
}

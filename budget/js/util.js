// Small helpers shared by every module: DOM, dates, money and numbers.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ----------------------------------------------------------------- dates -- */
const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoDate(new Date());
export const thisMonth = () => today().slice(0, 7);
export function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}
export function addMonths(mk, n) {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
export function monthDiff(a, b) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}
export function daysInMonth(mk) {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 864e5);
}
export function monthName(mk, style = "long") {
  const [y, m] = mk.split("-").map(Number);
  const opts =
    style === "short" ? { month: "short" } :
    style === "shortyear" ? { month: "short", year: "2-digit" } :
    style === "month" ? { month: "long" } :
    { month: "long", year: "numeric" };
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, opts);
}
export function dayLabel(iso) {
  if (iso === today()) return "Today";
  if (iso === yesterday()) return "Yesterday";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/* --------------------------------------------------------------- numbers -- */
export const round2 = (n) => Math.round((+n || 0) * 100) / 100;
export const sum = (arr, f = (x) => x) => round2(arr.reduce((a, x) => a + (+f(x) || 0), 0));
/** Reads "12,500", "12.5k", "₦1.2m" and similar. Returns NaN when nothing usable. */
export function parseAmount(v) {
  const s = String(v ?? "").trim().toLowerCase().replace(/,/g, "");
  const m = s.match(/-?\d*\.?\d+/);
  if (!m) return NaN;
  let n = parseFloat(m[0]);
  const rest = s.slice(m.index + m[0].length).trim();
  if (/^k\b|^k$|^thousand/.test(rest)) n *= 1e3;
  else if (/^m\b|^m$|^mil/.test(rest)) n *= 1e6;
  else if (/^b\b|^b$|^bil/.test(rest)) n *= 1e9;
  return round2(n);
}
export function niceMax(v) {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/* ----------------------------------------------------------------- money -- */
let currency = "NGN";
const fmtCache = new Map();
export function setCurrency(c) {
  currency = c || "NGN";
  fmtCache.clear();
}
function formatter(kind) {
  const key = currency + kind;
  if (!fmtCache.has(key)) {
    const base = { style: "currency", currency };
    const opts =
      kind === "c" ? { ...base, notation: "compact", maximumFractionDigits: 1 } :
      kind === "0" ? { ...base, minimumFractionDigits: 0, maximumFractionDigits: 0 } :
      { ...base, minimumFractionDigits: 2, maximumFractionDigits: 2 };
    let f;
    try { f = new Intl.NumberFormat(undefined, { ...opts, currencyDisplay: "narrowSymbol" }); }
    catch { f = new Intl.NumberFormat(undefined, opts); }
    fmtCache.set(key, f);
  }
  return fmtCache.get(key);
}
/** money(1500) → "₦1,500"; options: sign (+ for positives), compact (₦1.5K). */
export function money(n, { sign = false, compact = false } = {}) {
  const v = round2(n);
  const kind = compact ? "c" : Number.isInteger(v) ? "0" : "2";
  const s = formatter(kind).format(v);
  return sign && v > 0 ? "+" + s : s;
}
export function currencySymbol() {
  const part = formatter("0").formatToParts(0).find((p) => p.type === "currency");
  return part ? part.value : currency;
}

export const CURRENCIES = [
  ["NGN", "Nigerian naira"], ["USD", "US dollar"], ["EUR", "Euro"], ["GBP", "British pound"],
  ["GHS", "Ghanaian cedi"], ["KES", "Kenyan shilling"], ["ZAR", "South African rand"], ["XOF", "West African CFA franc"],
  ["XAF", "Central African CFA franc"], ["EGP", "Egyptian pound"], ["MAD", "Moroccan dirham"], ["RWF", "Rwandan franc"],
  ["UGX", "Ugandan shilling"], ["TZS", "Tanzanian shilling"], ["ETB", "Ethiopian birr"], ["CAD", "Canadian dollar"],
  ["AUD", "Australian dollar"], ["INR", "Indian rupee"], ["AED", "UAE dirham"], ["SAR", "Saudi riyal"],
  ["CNY", "Chinese yuan"], ["JPY", "Japanese yen"], ["BRL", "Brazilian real"], ["MXN", "Mexican peso"], ["CHF", "Swiss franc"]
];
export function guessCurrency() {
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
  const map = {
    "africa/lagos": "NGN", "africa/accra": "GHS", "africa/nairobi": "KES", "africa/johannesburg": "ZAR",
    "africa/cairo": "EGP", "africa/casablanca": "MAD", "africa/kigali": "RWF", "africa/kampala": "UGX",
    "africa/dar_es_salaam": "TZS", "africa/addis_ababa": "ETB", "africa/dakar": "XOF", "africa/abidjan": "XOF",
    "africa/douala": "XAF", "europe/london": "GBP", "asia/kolkata": "INR", "asia/calcutta": "INR",
    "asia/dubai": "AED", "asia/riyadh": "SAR", "asia/shanghai": "CNY", "asia/tokyo": "JPY",
    "america/toronto": "CAD", "america/vancouver": "CAD", "america/sao_paulo": "BRL", "america/mexico_city": "MXN",
    "europe/zurich": "CHF"
  };
  if (map[tz]) return map[tz];
  if (tz.startsWith("australia/")) return "AUD";
  if (tz.startsWith("europe/")) return "EUR";
  if (tz.startsWith("america/")) return "USD";
  return "NGN";
}

/* ---------------------------------------------------------- downloads -- */
export function download(filename, data, type = "application/octet-stream") {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load " + src));
    document.head.appendChild(s);
  });
}

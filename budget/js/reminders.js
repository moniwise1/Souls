// Daily check-in reminders.
//  1. While the app is open (or installed and running in the background):
//     a timer fires a notification at your reminder time.
//  2. Installed app on Android/desktop Chrome: periodic background sync lets
//     the service worker remind you even when the app is closed.
//  3. Everywhere, reliably: a repeating calendar event (Google Calendar link
//     or an .ics file for Apple/Outlook calendars).

import { state, summary, hasPlan } from "./store.js";
import { today, thisMonth, money, download } from "./util.js";

let timer = null;
let reg = null;
let onDue = null;
let persist = null;

export async function initReminders(handler, save) {
  onDue = handler;
  persist = save;
  await register();
  schedule();
}
async function register() {
  if (reg || !("serviceWorker" in navigator)) return reg;
  try { reg = await navigator.serviceWorker.register("sw.js"); } catch (e) { console.warn("Service worker:", e); }
  return reg;
}

export const notificationsSupported = () => "Notification" in window;
export const permission = () => (notificationsSupported() ? Notification.permission : "unsupported");

export async function enable() {
  let p = permission();
  // ask first, while the tap still counts as a user gesture
  if (p === "default") p = await Notification.requestPermission();
  state.settings.remindersOn = true;
  await register();
  await registerBackground();
  schedule();
  return p;
}
export function disable() {
  state.settings.remindersOn = false;
  clearTimeout(timer);
}

async function registerBackground() {
  try {
    const r = reg;
    if (!r || !("periodicSync" in r)) return false;
    const st = await navigator.permissions.query({ name: "periodic-background-sync" }).catch(() => null);
    if (st && st.state !== "granted") return false;
    await r.periodicSync.register("daily-checkin", { minInterval: 4 * 60 * 60 * 1000 });
    return true;
  } catch { return false; }
}

export function message() {
  const mk = thisMonth();
  const s = summary(mk);
  return {
    title: "Time for your daily money check-in",
    body: hasPlan(mk)
      ? `${money(s.balance)} left this month (${money(s.perDay)}/day). What did you spend today?`
      : "Log what you spent today and keep your plan honest."
  };
}

export async function notify(title, body) {
  if (permission() !== "granted") return false;
  const opts = { body, icon: "icon-192.png", badge: "icon-192.png", tag: "daily-checkin", renotify: true, data: { url: "./#home" } };
  try {
    const r = reg || (await register());
    if (r) await r.showNotification(title, opts);
    else new Notification(title, opts);
    return true;
  } catch { return false; }
}

/** Arms a timer for the next reminder time today (or tomorrow). */
export function schedule() {
  clearTimeout(timer);
  syncMeta();
  if (!state.settings.remindersOn) return;
  const [h, m] = (state.settings.reminderTime || "20:00").split(":").map(Number);
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  timer = setTimeout(() => { fire(); schedule(); }, Math.min(next - now, 2 ** 31 - 1));
}
function fire() {
  const t = today();
  if (state.checkins[t] || state.settings.lastNotified === t) return;
  state.settings.lastNotified = t;
  persist?.();
  const { title, body } = message();
  if (document.visibilityState === "visible") onDue?.(title, body);
  else notify(title, body);
}

/** Shares what the service worker needs (it can't read the app's storage). */
export async function syncMeta() {
  if (!("caches" in window) || !reg) return;
  try {
    const c = await caches.open("bp-meta");
    const url = new URL("__meta", reg.scope).href;
    const old = await c.match(url).then((r) => (r ? r.json() : {})).catch(() => ({}));
    const { title, body } = message();
    const meta = {
      ...old,
      on: !!state.settings.remindersOn,
      time: state.settings.reminderTime,
      checkedIn: state.checkins[today()] ? today() : old.checkedIn === today() ? today() : null,
      title, body
    };
    await c.put(url, new Response(JSON.stringify(meta), { headers: { "Content-Type": "application/json" } }));
  } catch {}
}

/* ------------------------------------------------------- calendar -- */
const appUrl = () => location.href.split(/[?#]/)[0];
function nextStart() {
  const [h, m] = (state.settings.reminderTime || "20:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d;
}
const stamp = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;

export function googleCalendarUrl() {
  const s = nextStart();
  const e = new Date(s.getTime() + 5 * 60000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: "💰 Log today's spending",
    details: `Two minutes with your budget: log what you spent today.\n${appUrl()}`,
    dates: `${stamp(s)}/${stamp(e)}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    recur: "RRULE:FREQ=DAILY"
  });
  return "https://calendar.google.com/calendar/render?" + p.toString();
}
export function downloadICS() {
  const s = nextStart();
  const now = new Date();
  const utc = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}00Z`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Budget Partner//Daily check-in//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:daily-checkin-${Date.now()}@budget-partner`,
    `DTSTAMP:${utc}`,
    `DTSTART:${stamp(s)}`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:💰 Log today's spending",
    `DESCRIPTION:Two minutes with your budget: log what you spent today.\\n${appUrl()}`,
    `URL:${appUrl()}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Log today's spending", "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  download("daily-budget-reminder.ics", ics, "text/calendar");
}

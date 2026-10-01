// Budget Partner: screens, dialogs and wiring.

import { CONFIG } from "../config.js";
import {
  $, $$, esc, uid, today, thisMonth, addMonths, monthDiff, monthName, dayLabel, money, setCurrency, currencySymbol,
  parseAmount, round2, sum, CURRENCIES
} from "./util.js";
import {
  state, setState, freshState, DEFAULT_CATEGORIES, ICONS, cat, activeCats, goal, monthData, ensureMonth, hasPlan,
  expensesIn, contributionsIn, byDateDesc, summary, goalSaved, goalSuggestion, goalStatus, streakDays, forecast,
  whatIf, everydayEstimate, autoEveryday, startBalance, autoStartBalance, startMonth, starterPlan, insights, addCategory
} from "./store.js";
import * as auth from "./auth.js";
import { trendChart, balanceChart } from "./charts.js";
import { exportExcel, exportCSV, exportBackup, readBackup, emailReport } from "./export.js";
import { ask, SUGGESTIONS } from "./ai.js";
import * as rem from "./reminders.js";

/* ============================================================ icons == */
const P = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  activity: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  plan: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  goals: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  future: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  ai: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M12 8.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
  reports: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  reminders: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout: '<path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  cloud: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

const VIEWS = {
  home: ["Dashboard", viewHome],
  activity: ["Transactions", viewActivity],
  plan: ["Budget plan", viewPlan],
  goals: ["Savings goals", viewGoals],
  future: ["Future planner", viewFuture],
  ai: ["Ask AI", viewAI],
  reports: ["Reports & export", viewReports],
  reminders: ["Reminders", viewReminders],
  settings: ["Settings", viewSettings]
};
const MONTH_VIEWS = new Set(["home", "activity", "plan", "reports"]);
const ui = { view: "home", month: thisMonth(), tx: "all", q: "", txCat: "", authTab: "in", busy: false, today: today() };
let installPrompt = null;

/* ========================================================= helpers == */
function save() {
  auth.saveData(state);
  rem.syncMeta();
}
let toastTimer;
function toast(msg, action) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ""}`;
  if (action) t.querySelector("button").onclick = () => { t.classList.remove("show"); action.fn(); };
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), action ? 6000 : 3200);
}
function applyTheme() {
  const t = state.settings.theme;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
const amountField = (name, value = "", label = "Amount", extra = "") => `
  <label class="field"><span>${label}</span>
    <div class="amt-wrap"><span class="cur">${esc(currencySymbol())}</span>
    <input name="${name}" inputmode="decimal" autocomplete="off" value="${value === "" || value == null ? "" : value}" ${extra} placeholder="0"></div>
  </label>`;
const catOptions = (sel, { blank = false } = {}) =>
  (blank ? `<option value="">No category</option>` : "") +
  activeCats().map((c) => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${c.icon} ${esc(c.name)}</option>`).join("");
function meter(value, total, cls = "") {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : value > 0 ? 100 : 0;
  return `<div class="meter ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div>`;
}
function monthSwitch() {
  return `<div class="month-switch">
    <button class="icon-btn" data-act="month" data-d="-1" aria-label="Previous month">${icon("left")}</button>
    <strong>${monthName(ui.month)}</strong>
    <button class="icon-btn" data-act="month" data-d="1" aria-label="Next month">${icon("right")}</button>
    ${ui.month !== thisMonth() ? `<button class="chip" data-act="month-now">This month</button>` : ""}
  </div>`;
}
const fieldError = (form, msg) => {
  const box = form.querySelector(".form-error");
  if (box) { box.textContent = msg; box.hidden = false; }
  return false;
};

/* ========================================================== dialog == */
const dlg = () => $("#dlg");
function openDialog(html, onSubmit, onReady) {
  const d = dlg();
  d.innerHTML = `<form class="dlg-form" novalidate>
    <button type="button" class="icon-btn dlg-x" data-close aria-label="Close">${icon("x")}</button>
    ${html}<p class="form-error" role="alert" hidden></p></form>`;
  const form = d.querySelector("form");
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const r = await onSubmit?.(new FormData(form), form);
    if (r !== false) closeDialog();
  });
  d.showModal();
  onReady?.(form);
  const f = form.querySelector("[autofocus]") || form.querySelector("input:not([type=radio]):not([type=checkbox]):not([type=hidden]), select, textarea");
  f?.focus();
}
const closeDialog = () => dlg().open && dlg().close();

/** In-app confirmation (the browser's confirm() is blocked in some hosts). Resolves true or false. */
function askConfirm(title, message, { ok = "Confirm", danger = false, typed = "" } = {}) {
  return new Promise((resolve) => {
    let answer = false;
    openDialog(`
      <h2>${esc(title)}</h2>
      <p>${esc(message).replace(/\n/g, "<br>")}</p>
      ${typed ? `<label class="field"><span>Type ${esc(typed)} to confirm</span><input name="typed" autocomplete="off" autofocus></label>` : ""}
      <div class="dlg-actions"><span class="spacer"></span><button type="button" class="btn" data-close>Cancel</button>
        <button class="btn ${danger ? "danger-solid" : "primary"}">${esc(ok)}</button></div>`,
    (fd, form) => {
      if (typed && fd.get("typed") !== typed) return fieldError(form, `Type ${typed} exactly to continue.`);
      answer = true;
    });
    dlg().addEventListener("close", () => resolve(answer), { once: true });
  });
}

/* ============================================================ auth == */
function renderAuth(note = "") {
  document.body.classList.remove("in");
  const up = ui.authTab === "up";
  $("#app").innerHTML = `
  <div class="auth">
    <section class="auth-hero">
      <img src="icon.svg" alt="" class="auth-logo" width="56" height="56">
      <h1>${esc(CONFIG.appName)}</h1>
      <p class="auth-tag">Your daily money partner. Plan every naira, track every spend, see your future before you get there.</p>
      <ul class="auth-points">
        <li>📊 A live balance that drops as you spend</li>
        <li>🔔 Daily check-ins so nothing slips</li>
        <li>🎯 Savings goals and a 12-month forecast</li>
        <li>🤖 Ask AI about your own money</li>
      </ul>
    </section>
    <section class="auth-card">
      <div class="seg" role="tablist">
        <button role="tab" aria-selected="${!up}" data-act="auth-tab" data-tab="in">Sign in</button>
        <button role="tab" aria-selected="${up}" data-act="auth-tab" data-tab="up">Create account</button>
      </div>
      ${note ? `<p class="notice">${esc(note)}</p>` : ""}
      ${!auth.cryptoReady ? `<p class="notice bad">Open this app over https (or localhost) so your data can be encrypted.</p>` : ""}
      <form id="auth-form" novalidate>
        ${up ? `<label class="field"><span>Your name</span><input name="name" autocomplete="name" required placeholder="e.g. Joel"></label>` : ""}
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required value="${up ? "" : esc(auth.lastEmail())}"></label>
        <label class="field"><span>Password</span>
          <div class="pw"><input name="password" type="password" autocomplete="${up ? "new-password" : "current-password"}" required minlength="8" placeholder="${up ? "At least 8 characters" : ""}">
          <button type="button" class="link" data-act="toggle-pw">Show</button></div></label>
        ${up ? `<label class="field"><span>Confirm password</span><input name="confirm" type="password" autocomplete="new-password" required></label>` : ""}
        <label class="check"><input type="checkbox" name="remember" checked> Keep me signed in on this device</label>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn primary block" ${auth.cryptoReady ? "" : "disabled"}>${up ? "Create account" : "Sign in"}</button>
        ${up ? "" : `<button type="button" class="link center" data-act="forgot">Forgot password?</button>`}
      </form>
      <p class="small muted auth-foot">${icon("lock")} ${auth.cloudEnabled
        ? "Your account syncs to your own private cloud space. Nobody else can read it."
        : "Your account lives on this device and your data is encrypted with your password. Export a backup now and then."}</p>
    </section>
  </div>`;
  $("#auth-form").addEventListener("submit", onAuthSubmit);
}
async function onAuthSubmit(ev) {
  ev.preventDefault();
  const form = ev.target;
  const fd = new FormData(form);
  const btn = form.querySelector("button.primary");
  const err = form.querySelector(".form-error");
  err.hidden = true;
  const creds = { name: (fd.get("name") || "").trim(), email: fd.get("email"), password: fd.get("password"), remember: !!fd.get("remember") };
  if (ui.authTab === "up") {
    if (!creds.name) return fieldError(form, "Tell us your name.");
    if (creds.password !== fd.get("confirm")) return fieldError(form, "The two passwords don't match.");
  }
  btn.disabled = true;
  btn.textContent = ui.authTab === "up" ? "Creating your account…" : "Signing in…";
  try {
    const res = ui.authTab === "up" ? await auth.signUp(creds) : await auth.signIn(creds);
    if (res?.needsConfirm) {
      ui.authTab = "in";
      return renderAuth("Almost there! We sent you a confirmation email. Tap the link, then sign in here.");
    }
    await enterApp(creds.name);
  } catch (e) {
    fieldError(form, e.message);
    btn.disabled = false;
    btn.textContent = ui.authTab === "up" ? "Create account" : "Sign in";
  }
}

async function enterApp(name = "") {
  const data = await auth.loadData();
  setState(data || freshState());
  if (!state.settings.name) state.settings.name = name || auth.current.name || "";
  openApp();
}
/** Shows the app for the data already in `state`. */
function openApp() {
  setCurrency(state.settings.currency);
  applyTheme();
  document.body.classList.add("in");
  if (!state.settings.setupDone) return renderSetup();
  renderShell();
  const v = location.hash.slice(1);
  go(VIEWS[v] ? v : "home", false);
  rem.initReminders((title, body) => {
    toast(body, { label: "Add expense", fn: () => expenseDialog() });
    renderView();
  }, save);
}

/* =========================================================== setup == */
function renderSetup() {
  $("#app").innerHTML = `
  <div class="setup">
    <form id="setup-form" class="setup-card" novalidate>
      <p class="eyebrow">Step 1 of 1 · About 1 minute</p>
      <h1>Let's set up your money plan${state.settings.name ? ", " + esc(state.settings.name.split(" ")[0]) : ""}</h1>
      <div class="row2">
        <label class="field"><span>Currency</span><select name="currency">${CURRENCIES.map(([c, n]) => `<option value="${c}" ${c === state.settings.currency ? "selected" : ""}>${c} · ${n}</option>`).join("")}</select></label>
        <label class="field"><span>Payday (day of month)</span><input name="payday" type="number" min="1" max="31" value="25" inputmode="numeric"></label>
      </div>
      <label class="field"><span>Monthly take-home income</span><input name="income" inputmode="decimal" placeholder="e.g. 450,000" autocomplete="off"></label>
      <fieldset class="field"><legend>What do you spend on? (tap to remove)</legend>
        <div class="pick-cats">${DEFAULT_CATEGORIES.map(([n, i], k) => `<label class="pill"><input type="checkbox" name="cat" value="${k}" checked><span>${i} ${esc(n)}</span></label>`).join("")}</div>
      </fieldset>
      <label class="check"><input type="checkbox" name="starter" checked> Pre-fill my plan with the 50/30/20 rule (50% needs, 30% wants, 20% savings). I can change every number.</label>
      <div class="row2">
        <label class="field"><span>Daily check-in reminder</span><input type="time" name="time" value="20:00"></label>
        <label class="check self-end"><input type="checkbox" name="notify" checked> Remind me every day</label>
      </div>
      <p class="form-error" role="alert" hidden></p>
      <button class="btn primary block">Start my plan</button>
      <button type="button" class="link center" data-act="restore-backup">Restore from a backup file instead</button>
    </form>
  </div>`;
  $("#setup-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const fd = new FormData(form);
    const income = parseAmount(fd.get("income"));
    if (fd.get("income") && !(income >= 0)) return fieldError(form, "Enter your income as a number, e.g. 450000.");
    state.settings.currency = fd.get("currency");
    setCurrency(state.settings.currency);
    state.settings.reminderTime = fd.get("time") || "20:00";
    const picked = fd.getAll("cat").map(Number);
    state.categories = DEFAULT_CATEGORIES.filter((_, k) => picked.includes(k) || DEFAULT_CATEGORIES[k][0] === "Other")
      .map(([name, icon, kind, weight]) => ({ id: uid(), name, icon, kind, weight }));
    const mk = thisMonth();
    if (income > 0) {
      const payday = Math.min(31, Math.max(1, +fd.get("payday") || 25));
      state.recurring.push({ id: uid(), name: "Salary", type: "income", amount: income, every: "month", day: payday, start: mk, end: "" });
      let g = null;
      if (fd.get("starter")) {
        g = { id: uid(), name: "Emergency fund", icon: "🛡️", target: round2(income * 0.8 * 6), deadline: "", monthly: round2(income * 0.2), created: mk };
        state.goals.push(g);
      }
      startMonth(mk, { fresh: true });
      if (fd.get("starter")) starterPlan(mk, income, g?.id);
    }
    state.settings.setupDone = true;
    save();
    if (fd.get("notify")) await rem.enable().catch(() => {});
    save();
    openApp();
    toast(income > 0 ? "Your plan is ready. Adjust any number on the Budget plan screen." : "Welcome! Add your income on the Budget plan screen.");
  });
}

/* =========================================================== shell == */
const NAV = ["home", "activity", "plan", "goals", "future", "ai", "reports", "reminders", "settings"];
const NAV_ICON = { home: "home", activity: "activity", plan: "plan", goals: "goals", future: "future", ai: "ai", reports: "reports", reminders: "reminders", settings: "settings" };
function renderShell() {
  const name = state.settings.name || auth.current.email;
  $("#app").innerHTML = `
  <div class="shell">
    <aside class="drawer" id="drawer" aria-label="Menu">
      <div class="brand"><img src="icon.svg" alt="" width="32" height="32"><span>${esc(CONFIG.appName)}</span></div>
      <div class="me"><span class="avatar">${esc(name.trim()[0]?.toUpperCase() || "•")}</span>
        <div><strong>${esc(name)}</strong><small>${esc(auth.current.email)}</small></div></div>
      <nav class="menu">${NAV.map((v) => `<a href="#${v}" data-nav="${v}">${icon(NAV_ICON[v])}<span>${VIEWS[v][0]}</span>${v === "ai" ? '<em class="badge">New</em>' : ""}</a>`).join("")}</nav>
      <button class="menu-out" data-act="sign-out">${icon("logout")}<span>Sign out</span></button>
    </aside>
    <div class="scrim" data-act="close-menu"></div>
    <div class="main-col">
      <header class="topbar">
        <button class="icon-btn menu-btn" data-act="open-menu" aria-label="Open menu">${icon("menu")}</button>
        <h1 id="title"></h1>
        <span class="sync" id="sync"></span>
        <button class="btn primary sm desk-only" data-act="add-expense">${icon("plus")} Add expense</button>
      </header>
      <main id="view" tabindex="-1"></main>
    </div>
    <nav class="tabbar" aria-label="Quick navigation">
      <a href="#home" data-nav="home">${icon("home")}<span>Home</span></a>
      <a href="#activity" data-nav="activity">${icon("activity")}<span>Activity</span></a>
      <button class="fab" data-act="add-expense" aria-label="Add expense">${icon("plus")}</button>
      <a href="#plan" data-nav="plan">${icon("plan")}<span>Plan</span></a>
      <a href="#ai" data-nav="ai">${icon("ai")}<span>Ask AI</span></a>
    </nav>
  </div>`;
  showSync(auth.syncStatus);
}
function showSync(s) {
  const el = $("#sync");
  if (!el) return;
  const map = { device: ["On this device", "lock"], synced: ["Synced", "cloud"], saving: ["Saving…", "cloud"], syncing: ["Syncing…", "cloud"], offline: ["Offline · saved here", "cloud"], error: ["Not saved!", "cloud"], idle: ["", "cloud"] };
  const [label, ic] = map[s] || map.idle;
  el.className = "sync " + s;
  el.innerHTML = label ? `${icon(ic)}<span>${label}</span>` : "";
}
auth.onSync(showSync);

function go(view, push = true) {
  ui.view = VIEWS[view] ? view : "home";
  if (push && location.hash.slice(1) !== ui.view) history.pushState(null, "", "#" + ui.view);
  renderView();
  window.scrollTo(0, 0);
}
function renderView() {
  if (!document.body.classList.contains("in") || !$("#view")) return;
  if (ui.today !== today()) { ui.today = today(); ui.month = thisMonth(); }
  const [title, fn] = VIEWS[ui.view];
  $("#title").textContent = title;
  document.title = `${title} · ${CONFIG.appName}`;
  $$("[data-nav]").forEach((a) => a.toggleAttribute("aria-current", a.dataset.nav === ui.view));
  $("#view").innerHTML = (MONTH_VIEWS.has(ui.view) ? monthSwitch() : "") + fn();
  document.body.classList.remove("menu-open");
  afterRender[ui.view]?.();
}
const afterRender = {
  ai() {
    const log = $("#chat-log");
    if (log) log.scrollTop = log.scrollHeight;
  }
};

/* ======================================================= dashboard == */
function viewHome() {
  const mk = ui.month;
  const s = summary(mk);
  const cur = mk === thisMonth();
  const hide = state.settings.hideBalance;
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = (state.settings.name || "").split(" ")[0];
  const used = s.income > 0 ? Math.min(100, ((s.spent + Math.max(0, s.saved)) / s.income) * 100) : 0;
  const bal = (v) => (hide ? "••••••" : money(v));
  const recent = [...expensesIn(mk)].sort(byDateDesc).slice(0, 6);
  const months = [5, 4, 3, 2, 1, 0].map((n) => addMonths(mk, -n)).map((k) => { const x = summary(k); return { mk: k, income: x.income, spent: x.spent, saved: x.saved }; });
  return `
  <p class="greet">${greet}${first ? ", " + esc(first) : ""} 👋</p>
  <section class="balance-card">
    <div class="bc-top"><span>Money left · ${monthName(mk)}</span>
      <button class="icon-btn" data-act="toggle-balance" aria-label="${hide ? "Show" : "Hide"} balance">${icon(hide ? "eyeoff" : "eye")}</button></div>
    <div class="bc-amount ${s.balance < 0 ? "neg" : ""}">${bal(s.balance)}</div>
    <div class="bc-sub">${s.income ? `from ${bal(s.income)} income · ${bal(s.spent)} spent · ${bal(s.saved)} saved` : "Add your income to start your balance"}</div>
    <div class="bc-meter" role="progressbar" aria-label="Share of income used" aria-valuenow="${Math.round(used)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${used}%"></span></div>
    <div class="bc-row">
      <div><small>${cur ? "Safe to spend today" : "Budget left"}</small><strong>${cur ? bal(s.perDay) : bal(s.budgetLeft)}</strong></div>
      <div><small>Budget left</small><strong>${bal(s.budgetLeft)}</strong></div>
      <div><small>Unassigned</small><strong>${bal(s.unassigned)}</strong></div>
    </div>
  </section>
  <section class="quick">
    <button data-act="add-expense"><span class="q-ic out">${icon("down")}</span>Spend</button>
    <button data-act="add-income"><span class="q-ic in">${icon("up")}</span>Income</button>
    <button data-act="contribute"><span class="q-ic save">${icon("goals")}</span>Save</button>
    <button data-act="move-money"><span class="q-ic">${icon("swap")}</span>Move</button>
  </section>
  ${cur ? checkinCard() : ""}
  <section class="card">
    <div class="card-head"><h2>Your money partner says</h2><button class="link" data-act="go" data-arg="ai">Ask AI</button></div>
    <ul class="insights">${insights(mk).slice(0, 6).map(insightItem).join("") || `<li class="ins good"><span>✅</span><p>All quiet. Nothing needs your attention.</p></li>`}</ul>
  </section>
  <div class="grid2">
    <section class="card">
      <div class="card-head"><h2>Budget by category</h2><button class="link" data-act="go" data-arg="plan">Edit plan</button></div>
      ${categoryBars(s)}
    </section>
    <section class="card">
      <div class="card-head"><h2>Recent spending</h2><button class="link" data-act="go" data-arg="activity">See all</button></div>
      ${recent.length ? `<ul class="tx-list">${recent.map(txExpense).join("")}</ul>` : `<p class="empty">No spending logged for ${monthName(mk, "month")} yet.</p>`}
    </section>
  </div>
  <section class="card"><h2>Last 6 months</h2>${trendChart(months)}</section>`;
}
function checkinCard() {
  const t = today();
  const todays = state.expenses.filter((e) => e.date === t);
  const done = !!state.checkins[t];
  const streak = streakDays();
  return `<section class="card checkin ${done ? "done" : ""}">
    <div class="ci-main">
      <div class="ci-title">${done ? (todays.length ? `Today: ${money(sum(todays, (e) => e.amount))} in ${todays.length} item${todays.length > 1 ? "s" : ""}` : "Checked in: nothing spent today 👏") : "Daily check-in"}</div>
      <div class="small muted">${done ? "Spent more? Add it any time." : "What did you spend today? It takes 10 seconds."}</div>
    </div>
    <div class="ci-actions">
      <button class="btn primary sm" data-act="add-expense">Add expense</button>
      ${done ? "" : `<button class="btn sm" data-act="no-spend">Nothing today</button>`}
    </div>
    ${streak > 1 ? `<div class="streak" title="Days in a row you've checked in">🔥 ${streak}-day streak</div>` : ""}
  </section>`;
}
function insightItem(i) {
  return `<li class="ins ${i.lvl}"><span aria-hidden="true">${i.icon}</span><p>${esc(i.text)}</p>${i.act ? `<button class="btn sm" data-act="${i.act}" data-arg="${esc(i.arg || "")}">${esc(i.label)}</button>` : ""}</li>`;
}
function categoryBars(s) {
  if (!s.rows.length) return `<p class="empty">No budget yet. <button class="link" data-act="go" data-arg="plan">Plan this month</button></p>`;
  return `<ul class="cat-bars">${s.rows.map((r) => {
    const st = r.status === "over" ? `<span class="st bad">▲ Over by ${money(-r.left)}</span>`
      : r.status === "warn" ? `<span class="st warn">● ${money(r.left)} left</span>`
      : r.status === "pace" ? `<span class="st warn">● Spending fast · ${money(r.left)} left</span>`
      : `<span class="muted">${money(r.left)} left</span>`;
    return `<li><div class="cb-top"><span>${r.cat.icon} ${esc(r.cat.name)}</span><span class="num">${money(r.spent)} <span class="muted">/ ${money(r.budget)}</span></span></div>
      ${meter(r.spent, r.budget, r.status === "over" ? "bad" : r.status === "ok" ? "" : "warn")}<div class="small">${st}</div></li>`;
  }).join("")}</ul>`;
}
function txExpense(e) {
  const c = cat(e.catId);
  return `<li><button class="tx" data-act="edit-expense" data-arg="${e.id}">
    <span class="tx-ic">${c.icon}</span>
    <span class="tx-main"><span class="tx-title">${esc(e.note || c.name)}</span><span class="tx-sub">${esc(c.name)} · ${dayLabel(e.date)}${e.method ? " · " + esc(e.method) : ""}</span></span>
    <span class="tx-amt out">−${money(e.amount)}</span></button></li>`;
}

/* ==================================================== transactions == */
function viewActivity() {
  const mk = ui.month;
  const s = summary(mk);
  const chips = [["all", "All"], ["out", "Spending"], ["in", "Income"], ["save", "Savings"]];
  return `
  <section class="tiles">
    <div class="tile"><small>Money in</small><strong class="pos">${money(s.income)}</strong></div>
    <div class="tile"><small>Money out</small><strong>${money(s.spent)}</strong></div>
    <div class="tile"><small>Saved</small><strong>${money(s.saved)}</strong></div>
  </section>
  <div class="filters">
    <div class="chips" role="group" aria-label="Show">${chips.map(([k, l]) => `<button class="chip ${ui.tx === k ? "on" : ""}" data-act="tx-filter" data-arg="${k}" aria-pressed="${ui.tx === k}">${l}</button>`).join("")}</div>
    <input type="search" id="tx-search" placeholder="Search…" value="${esc(ui.q)}" aria-label="Search transactions">
    <select id="tx-cat" aria-label="Category"><option value="">All categories</option>${catOptions(ui.txCat)}</select>
  </div>
  <div id="tx-groups">${txGroups()}</div>`;
}
function txGroups() {
  const mk = ui.month;
  const q = ui.q.trim().toLowerCase();
  let items = [];
  if (ui.tx === "all" || ui.tx === "out")
    items.push(...expensesIn(mk).filter((e) => !ui.txCat || e.catId === ui.txCat).map((e) => ({ date: e.date, created: e.created, html: txExpense(e), amt: -e.amount, text: `${e.note} ${cat(e.catId).name}` })));
  if ((ui.tx === "all" || ui.tx === "in") && !ui.txCat)
    items.push(...monthData(mk).incomes.map((i) => ({
      date: i.date, created: 0, amt: i.received ? i.amount : 0, text: i.source,
      html: `<li><button class="tx" data-act="edit-income" data-arg="${i.id}"><span class="tx-ic in">💼</span>
        <span class="tx-main"><span class="tx-title">${esc(i.source)}</span><span class="tx-sub">Income · ${dayLabel(i.date)} · ${i.received ? "Received" : "Expected"}</span></span>
        <span class="tx-amt ${i.received ? "in" : "muted"}">+${money(i.amount)}</span></button></li>`
    })));
  if ((ui.tx === "all" || ui.tx === "save") && !ui.txCat)
    items.push(...contributionsIn(mk).map((c) => {
      const g = goal(c.goalId);
      return {
        date: c.date, created: 0, amt: -c.amount, text: `${g?.name} ${c.note || ""}`,
        html: `<li><button class="tx" data-act="edit-contribution" data-arg="${c.id}"><span class="tx-ic save">${g?.icon || "🎯"}</span>
          <span class="tx-main"><span class="tx-title">${c.amount >= 0 ? "Saved to" : "Took from"} ${esc(g?.name || "goal")}</span><span class="tx-sub">Savings · ${dayLabel(c.date)}${c.note ? " · " + esc(c.note) : ""}</span></span>
          <span class="tx-amt">${c.amount >= 0 ? "→" : "←"} ${money(Math.abs(c.amount))}</span></button></li>`
      };
    }));
  if (q) items = items.filter((i) => i.text.toLowerCase().includes(q));
  if (!items.length) return `<p class="empty card">Nothing here for ${monthName(mk)}.${ui.tx !== "in" ? ` <button class="link" data-act="add-expense">Add an expense</button>` : ""}</p>`;
  items.sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
  const groups = new Map();
  for (const i of items) (groups.get(i.date) || groups.set(i.date, []).get(i.date)).push(i);
  return [...groups].map(([d, list]) => {
    const out = sum(list.filter((i) => i.amt < 0), (i) => -i.amt);
    return `<section class="tx-day"><h3><span>${dayLabel(d)}</span>${out ? `<span class="muted num">−${money(out)}</span>` : ""}</h3><ul class="tx-list card">${list.map((i) => i.html).join("")}</ul></section>`;
  }).join("");
}

/* ============================================================ plan == */
function viewPlan() {
  const mk = ui.month;
  const s = summary(mk);
  const m = monthData(mk);
  const setup = !hasPlan(mk)
    ? `<section class="card setup-month">
        <h2>Set up ${monthName(mk)}</h2>
        <p class="muted">Start from your last plan, recurring income and bills, planned one-offs and goals. Then adjust.</p>
        <div class="btn-row"><button class="btn primary" data-act="start-month">Build my plan</button><button class="btn" data-act="start-fresh">Start empty</button></div>
      </section>` : "";
  const groups = [["need", "Needs", 50], ["want", "Wants", 30]];
  const goalsRows = state.goals.map((g) => {
    const sug = goalSuggestion(g, mk);
    return `<tr><td>${g.icon || "🎯"} ${esc(g.name)}<div class="small muted">${sug ? `Suggested ${money(sug)}` : goalStatus(g).label}</div></td>
      <td><input class="amt-in" inputmode="decimal" data-saving="${g.id}" value="${fmtIn(m.savings[g.id])}" placeholder="0" aria-label="Savings for ${esc(g.name)}"></td>
      <td class="num">${money(sum(contributionsIn(mk).filter((c) => c.goalId === g.id), (c) => c.amount))}</td><td></td></tr>`;
  }).join("");
  return `
  ${setup}
  <div class="assign-bar" id="assign-bar">${assignBar(s)}</div>
  ${state.settings.strict ? `<p class="notice small">🔒 <strong>Strict mode is on.</strong> Every unit of income gets a job, and overspending must be covered from another category. <button class="link" data-act="go" data-arg="settings">Change</button></p>` : ""}
  <section class="card">
    <div class="card-head"><h2>Income</h2><button class="btn sm" data-act="add-income">${icon("plus")} Add income</button></div>
    ${m.incomes.length ? `<ul class="tx-list">${[...m.incomes].sort((a, b) => a.date.localeCompare(b.date)).map((i) => `
      <li class="inc-row"><label class="check" title="Received?"><input type="checkbox" data-act="toggle-received" data-arg="${i.id}" ${i.received ? "checked" : ""}><span class="sr">Received</span></label>
        <button class="tx" data-act="edit-income" data-arg="${i.id}"><span class="tx-main"><span class="tx-title">${esc(i.source)}</span><span class="tx-sub">${dayLabel(i.date)} · ${i.received ? "Received ✓" : "Expected"}</span></span>
        <span class="tx-amt in">${money(i.amount)}</span></button></li>`).join("")}</ul>`
      : `<p class="empty">No income added for ${monthName(mk, "month")}.</p>`}
  </section>
  <section class="card">
    <div class="card-head"><h2>Spending budget</h2>
      <div class="btn-row"><button class="btn sm" data-act="move-money">${icon("swap")} Move money</button><button class="btn sm" data-act="add-category">${icon("plus")} Category</button></div></div>
    <table class="plan-tbl">
      <thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Left</th></tr></thead>
      ${groups.map(([kind, label, guide]) => {
        const cats = activeCats().filter((c) => c.kind === kind);
        const total = sum(cats, (c) => m.budgets[c.id] || 0);
        return `<tbody><tr class="grp"><th colspan="4">${label} <span class="muted small" id="sub-${kind}">${planSub(total, s.income, guide)}</span></th></tr>
        ${cats.map((c) => {
          const b = m.budgets[c.id] || 0;
          const sp = s.spentBy[c.id] || 0;
          return `<tr><td><button class="link plain" data-act="edit-category" data-arg="${c.id}">${c.icon} ${esc(c.name)}</button></td>
            <td><input class="amt-in" inputmode="decimal" data-budget="${c.id}" value="${fmtIn(b)}" placeholder="0" aria-label="Budget for ${esc(c.name)}"></td>
            <td class="num">${money(sp)}</td><td class="num ${b - sp < 0 ? "neg" : ""}" id="left-${c.id}">${money(b - sp)}</td></tr>`;
        }).join("")}</tbody>`;
      }).join("")}
    </table>
  </section>
  <section class="card">
    <div class="card-head"><h2>Savings <span class="muted small" id="sub-save">${planSub(s.savingsPlan, s.income, 20)}</span></h2><div class="btn-row">
      ${state.goals.length ? `<button class="btn sm" data-act="use-suggested">Use suggested</button>` : ""}<button class="btn sm" data-act="add-goal">${icon("plus")} Goal</button></div></div>
    ${state.goals.length ? `<table class="plan-tbl"><thead><tr><th>Goal</th><th>Plan</th><th>Saved</th><th></th></tr></thead><tbody>${goalsRows}</tbody></table>`
      : `<p class="empty">Pay yourself first. Create a goal (an emergency fund is a great start) and give it a share of your income.</p>`}
  </section>
  <div class="btn-row center">
    <button class="btn" data-act="copy-last">Copy last month's budgets</button>
    ${hasPlan(mk) ? `<button class="btn ghost danger" data-act="clear-plan">Clear this plan</button>` : ""}
  </div>`;
}
const fmtIn = (v) => (v > 0 ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "");
const planSub = (total, income, guide) =>
  `${money(total)}${income > 0 ? ` · ${Math.round((total / income) * 100)}% of income (guide ${guide}%)` : ""}`;
function assignBar(s) {
  const cls = Math.abs(s.unassigned) < 0.01 ? "good" : s.unassigned > 0 ? "warn" : "bad";
  const msg = cls === "good" ? "✓ Every unit has a job" : s.unassigned > 0 ? "Left to assign" : "Over-assigned by";
  return `<div class="ab ${cls}"><div class="ab-math small">${money(s.income)} income − ${money(s.budgeted)} budgets − ${money(s.savingsPlan)} savings</div>
    <div class="ab-res"><span>${msg}</span>${cls === "good" ? "" : `<strong>${money(Math.abs(s.unassigned))}</strong>`}</div></div>`;
}
function updatePlanLive() {
  const s = summary(ui.month);
  const m = monthData(ui.month);
  $("#assign-bar").innerHTML = assignBar(s);
  for (const c of activeCats()) {
    const el = $("#left-" + c.id);
    if (!el) continue;
    const left = (m.budgets[c.id] || 0) - (s.spentBy[c.id] || 0);
    el.textContent = money(left);
    el.classList.toggle("neg", left < 0);
  }
  for (const [kind, guide] of [["need", 50], ["want", 30]]) {
    const el = $("#sub-" + kind);
    if (el) el.textContent = planSub(sum(activeCats().filter((c) => c.kind === kind), (c) => m.budgets[c.id] || 0), s.income, guide);
  }
  const sv = $("#sub-save");
  if (sv) sv.textContent = planSub(s.savingsPlan, s.income, 20);
}

/* =========================================================== goals == */
function viewGoals() {
  const s = summary(thisMonth());
  const needs = sum(s.rows.filter((r) => r.cat.kind === "need"), (r) => r.budget);
  const total = sum(state.goals, (g) => goalSaved(g));
  const hasEmergency = state.goals.some((g) => /emergency/i.test(g.name));
  return `
  <section class="tiles">
    <div class="tile"><small>Total saved</small><strong class="pos">${money(total)}</strong></div>
    <div class="tile"><small>Saved this month</small><strong>${money(s.saved)}</strong></div>
    <div class="tile"><small>Planned this month</small><strong>${money(s.savingsPlan)}</strong></div>
  </section>
  <div class="btn-row"><button class="btn primary" data-act="add-goal">${icon("plus")} New goal</button><button class="btn" data-act="contribute">Add money to a goal</button></div>
  ${!hasEmergency && needs > 0 ? `<section class="card tip"><p>🛡️ <strong>Start an emergency fund.</strong> 3–6 months of your needs is ${money(needs * 3)}–${money(needs * 6)}. It turns emergencies into inconveniences.</p>
    <button class="btn sm" data-act="quick-emergency" data-arg="${needs * 6}">Create it</button></section>` : ""}
  <div class="goal-grid">${state.goals.map((g) => {
    const saved = goalSaved(g);
    const pct = g.target > 0 ? Math.min(100, (saved / g.target) * 100) : 0;
    const st = goalStatus(g);
    const sug = goalSuggestion(g);
    return `<article class="card goal">
      <div class="goal-top"><span class="goal-ic">${g.icon || "🎯"}</span><div><h3>${esc(g.name)}</h3>
        <small class="st ${st.key === "behind" || st.key === "late" ? "warn" : st.key === "done" ? "good" : "muted"}">${st.key === "behind" || st.key === "late" ? "● " : ""}${esc(st.label)}</small></div>
        <button class="link" data-act="edit-goal" data-arg="${g.id}">Edit</button></div>
      <div class="goal-amt"><strong>${money(saved)}</strong> <span class="muted">of ${money(g.target)}</span></div>
      ${meter(saved, g.target, st.key === "done" ? "good" : "")}
      <div class="goal-foot small muted">${Math.round(pct)}% · ${g.deadline ? `by ${monthName(g.deadline)}` : "no deadline"}${sug ? ` · ${money(sug)} this month` : ""}</div>
      <div class="btn-row"><button class="btn sm primary" data-act="contribute" data-arg="${g.id}">Add money</button><button class="btn sm" data-act="withdraw" data-arg="${g.id}">Withdraw</button></div>
    </article>`;
  }).join("") || `<p class="empty card">No goals yet. What are you saving for? A rainy day, rent, a car, school fees, a trip?</p>`}</div>`;
}

/* ========================================================== future == */
function viewFuture() {
  const f = forecast();
  const short = f.find((r) => r.balance < 0);
  const totalIn = sum(f, (r) => r.income);
  const totalSave = sum(f, (r) => r.savings);
  const end = f[f.length - 1];
  const nextMk = addMonths(thisMonth(), 3);
  return `
  <section class="card ${short ? "alert" : "ok"} future-head">
    ${short ? `<h2>⚠ You'd run short in ${monthName(short.mk)}</h2><p>On today's plan, free cash drops to ${money(short.balance)}. Cut a recurring cost, push a one-off later, or plan extra income.</p>`
      : `<h2>✅ Your next 12 months hold up</h2><p>Free cash stays positive. You end ${monthName(end.mk)} with about ${money(end.balance)} free and ${money(end.pot)} in savings.</p>`}
  </section>
  <section class="tiles">
    <div class="tile"><small>Income, next 12 months</small><strong class="pos">${money(totalIn, { compact: true })}</strong></div>
    <div class="tile"><small>Going to savings</small><strong>${money(totalSave, { compact: true })}</strong></div>
    <div class="tile"><small>Free cash in 12 months</small><strong class="${end.balance < 0 ? "neg" : ""}">${money(end.balance, { compact: true })}</strong></div>
  </section>
  <section class="card"><h2>Free cash at the end of each month</h2>${balanceChart(f)}</section>
  <section class="card">
    <h2>Can I afford it?</h2>
    <form class="whatif" data-form="whatif">
      <label class="field"><span>What</span><input name="name" placeholder="e.g. New laptop" required></label>
      ${amountField("amount", "", "How much")}
      <label class="field"><span>When</span><input type="month" name="month" value="${nextMk}" min="${addMonths(thisMonth(), 1)}"></label>
      <button class="btn primary">Check</button>
    </form>
    <div id="whatif-out" aria-live="polite"></div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Recurring income & bills</h2><button class="btn sm" data-act="add-recurring">${icon("plus")} Add</button></div>
    <p class="small muted">Salary, rent, subscriptions, school fees, anything that repeats.</p>
    ${state.recurring.length ? `<ul class="tx-list">${state.recurring.map((r) => `<li><button class="tx" data-act="edit-recurring" data-arg="${r.id}">
      <span class="tx-ic ${r.type === "income" ? "in" : ""}">${r.type === "income" ? "💼" : cat(r.catId).icon}</span>
      <span class="tx-main"><span class="tx-title">${esc(r.name)}</span><span class="tx-sub">Every ${r.every}${r.end ? ` until ${monthName(r.end)}` : ""}</span></span>
      <span class="tx-amt ${r.type === "income" ? "in" : "out"}">${r.type === "income" ? "+" : "−"}${money(r.amount)}</span></button></li>`).join("")}</ul>` : `<p class="empty">Nothing recurring yet.</p>`}
  </section>
  <section class="card">
    <div class="card-head"><h2>Planned one-offs</h2><button class="btn sm" data-act="add-planned">${icon("plus")} Add</button></div>
    <p class="small muted">Future costs and money you expect: rent renewal, a wedding, a bonus, a car service.</p>
    ${state.planned.length ? `<ul class="tx-list">${[...state.planned].sort((a, b) => a.month.localeCompare(b.month)).map((p) => `<li><button class="tx" data-act="edit-planned" data-arg="${p.id}">
      <span class="tx-ic ${p.type === "income" ? "in" : ""}">${p.type === "income" ? "💰" : cat(p.catId).icon}</span>
      <span class="tx-main"><span class="tx-title">${esc(p.name)}</span><span class="tx-sub">${monthName(p.month)}${p.type === "expense" && p.month > thisMonth() ? ` · save ${money(p.amount / Math.max(1, monthDiff(thisMonth(), p.month)))}/month` : ""}</span></span>
      <span class="tx-amt ${p.type === "income" ? "in" : "out"}">${p.type === "income" ? "+" : "−"}${money(p.amount)}</span></button></li>`).join("")}</ul>` : `<p class="empty">No planned one-offs.</p>`}
  </section>
  <section class="card">
    <h2>Assumptions</h2>
    <div class="row2">
      ${amountField("balance", state.settings.balance ?? "", "Money you'll have at the end of this month", `data-set="balance" placeholder="${fmtIn(autoStartBalance()) || autoStartBalance().toLocaleString()} (estimated)"`)}
      ${amountField("everyday", state.settings.everyday ?? "", "Everyday spending per month", `data-set="everyday" placeholder="${autoEveryday().toLocaleString()} (estimated)"`)}
    </div>
    <p class="small muted">Leave blank to use the estimates (from this month's plan and your last 3 months of spending). Savings goals are set aside first.</p>
  </section>
  <section class="card"><h2>Month by month</h2><div class="scroll-x"><table class="tbl">
    <thead><tr><th>Month</th><th>Income</th><th>Bills</th><th>One-offs</th><th>Everyday</th><th>Savings</th><th>Net</th><th>Free cash</th></tr></thead>
    <tbody>${f.map((r) => `<tr><td>${monthName(r.mk, "shortyear")}</td><td>${money(r.income)}</td><td>${money(r.bills)}</td><td>${money(r.oneoff)}</td><td>${money(r.everyday)}</td><td>${money(r.savings)}</td>
      <td class="${r.net < 0 ? "neg" : ""}">${money(r.net, { sign: true })}</td><td class="${r.balance < 0 ? "neg" : ""}"><strong>${money(r.balance)}</strong></td></tr>`).join("")}</tbody>
  </table></div></section>`;
}
function whatIfResult(name, amount, mk) {
  const r = whatIf(name, amount, mk);
  const body = r.ok
    ? `<p class="res good">✅ <strong>Yes, ${esc(name)} fits.</strong> Your lowest free cash would be ${money(r.low.balance)} in ${monthName(r.low.mk)}.</p>`
    : `<p class="res bad">⚠ <strong>Not on today's plan.</strong> You'd be ${money(-r.firstShort.balance)} short in ${monthName(r.firstShort.mk)}.${r.earliest ? ` The earliest it fits is <strong>${monthName(r.earliest)}</strong>.` : ""}</p>`;
  return `${body}<p class="small">To pay cash by ${monthName(mk)}, set aside <strong>${money(r.perMonth)}</strong> a month for ${r.monthsAway} month${r.monthsAway > 1 ? "s" : ""}.</p>
    <div class="btn-row"><button class="btn sm primary" data-act="whatif-plan" data-name="${esc(name)}" data-amount="${amount}" data-month="${mk}">Add to my plan</button>
    <button class="btn sm" data-act="whatif-goal" data-name="${esc(name)}" data-amount="${amount}" data-month="${mk}">Make it a savings goal</button></div>`;
}

/* ============================================================== AI == */
function viewAI() {
  const msgs = state.chat;
  return `
  <section class="chat card">
    <div class="chat-head">
      <div><strong>Your private money assistant</strong>
      <p class="small muted">${auth.aiEnabled ? "Answers use your numbers and can search the internet. Only you can see this chat." : "Answers come from your own numbers, right on this device. Internet-powered AI switches on in Settings → AI assistant."}</p></div>
      ${msgs.length ? `<button class="link" data-act="clear-chat">Clear</button>` : ""}
    </div>
    <div class="chat-log" id="chat-log" aria-live="polite">
      ${msgs.length ? msgs.map(chatBubble).join("") : `<div class="chat-empty"><p>Ask me anything about your money.</p></div>`}
      ${ui.busy ? `<div class="bubble assistant typing"><span></span><span></span><span></span></div>` : ""}
    </div>
    <div class="chips sugg">${SUGGESTIONS.map((q) => `<button class="chip" data-act="ask" data-arg="${esc(q)}">${esc(q)}</button>`).join("")}</div>
    <form class="chat-form" data-form="chat">
      <input name="q" placeholder="Ask about your spending, saving, planning…" autocomplete="off" aria-label="Your question" ${ui.busy ? "disabled" : ""}>
      <button class="btn primary icon-only" aria-label="Send" ${ui.busy ? "disabled" : ""}>${icon("send")}</button>
    </form>
  </section>`;
}
function chatBubble(m) {
  const html = esc(m.text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
  const src = (m.sources || []).slice(0, 4).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>`).join("");
  return `<div class="bubble ${m.role}">${html}${src ? `<div class="sources">${src}</div>` : ""}</div>`;
}
async function sendQuestion(q) {
  q = q.trim();
  if (!q || ui.busy) return;
  state.chat.push({ role: "user", text: q, at: Date.now() });
  ui.busy = true;
  renderView();
  try {
    const res = await ask(q);
    state.chat.push({ role: "assistant", text: res.text, sources: res.sources, at: Date.now() });
  } catch (e) {
    state.chat.push({ role: "assistant", text: `Sorry, I couldn't reach the AI just now (${e.message}). Try again in a moment.`, at: Date.now() });
  }
  state.chat = state.chat.slice(-100);
  ui.busy = false;
  save();
  if (ui.view === "ai") renderView();
  $(".chat-form input")?.focus();
}

/* ========================================================= reports == */
function viewReports() {
  const mk = ui.month;
  const s = summary(mk);
  const top = [...s.rows].filter((r) => r.spent > 0).sort((a, b) => b.spent - a.spent);
  const needs = sum(s.rows.filter((r) => r.cat.kind === "need"), (r) => r.spent);
  const wants = sum(s.rows.filter((r) => r.cat.kind !== "need"), (r) => r.spent);
  const rate = s.income > 0 ? Math.round((s.saved / s.income) * 100) : 0;
  return `
  <section class="tiles">
    <div class="tile"><small>Income</small><strong class="pos">${money(s.income)}</strong></div>
    <div class="tile"><small>Spent</small><strong>${money(s.spent)}</strong></div>
    <div class="tile"><small>Saved</small><strong>${money(s.saved)}</strong><small>${rate}% of income</small></div>
    <div class="tile"><small>Needs / wants</small><strong>${money(needs, { compact: true })} / ${money(wants, { compact: true })}</strong></div>
  </section>
  <section class="card"><h2>Where the money went</h2>
    ${top.length ? `<div class="scroll-x"><table class="tbl"><thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Share</th><th>Status</th></tr></thead><tbody>
      ${top.map((r) => `<tr><td>${r.cat.icon} ${esc(r.cat.name)}</td><td>${money(r.budget)}</td><td>${money(r.spent)}</td><td>${Math.round((r.spent / s.spent) * 100)}%</td>
        <td>${r.status === "over" ? '<span class="st bad">▲ Over</span>' : r.status === "ok" ? '<span class="st good">✓ OK</span>' : '<span class="st warn">● Close</span>'}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="empty">No spending in ${monthName(mk)}.</p>`}
  </section>
  <section class="card"><h2>Export & share</h2>
    <div class="export-grid">
      <button class="exp-btn" data-act="export-xlsx"><span>📗</span><strong>Excel workbook</strong><small>Transactions, monthly summary, plan, goals and forecast (.xlsx)</small></button>
      <button class="exp-btn" data-act="email-report"><span>✉️</span><strong>Email my data</strong><small>Send the Excel file to ${esc(auth.current.email)} or anyone you choose</small></button>
      <button class="exp-btn" data-act="export-csv"><span>📄</span><strong>CSV of expenses</strong><small>For Google Sheets, Numbers or your accountant</small></button>
      <button class="exp-btn" data-act="export-backup"><span>💾</span><strong>Full backup</strong><small>Everything, to restore on any device (.json)</small></button>
      <button class="exp-btn" data-act="restore-backup"><span>♻️</span><strong>Restore a backup</strong><small>Replace this account's data with a backup file</small></button>
    </div>
  </section>`;
}

/* ======================================================= reminders == */
function viewReminders() {
  const p = rem.permission();
  const on = state.settings.remindersOn;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `
  <section class="card">
    <div class="card-head"><h2>Daily check-in</h2>
      <label class="switch"><input type="checkbox" data-act="toggle-reminders" ${on ? "checked" : ""}><span></span><span class="sr">Daily reminders</span></label></div>
    <p class="muted">Every day at your chosen time, your partner nudges you to log what you spent. Logging, or tapping “Nothing today”, keeps your streak going 🔥 ${streakDays() > 1 ? `(currently ${streakDays()} days)` : ""}.</p>
    <label class="field narrow"><span>Remind me at</span><input type="time" data-set="reminderTime" value="${state.settings.reminderTime}"></label>
    <p class="small">Notifications: <strong>${{ granted: "allowed ✓", denied: "blocked in browser settings", default: "not yet allowed", unsupported: "not supported in this browser" }[p]}</strong>
      ${p === "granted" ? ` · <button class="link" data-act="test-notify">Send a test</button>` : p === "default" ? ` · <button class="link" data-act="toggle-reminders-on">Allow</button>` : ""}</p>
  </section>
  <section class="card">
    <h2>Never miss a day: add it to your calendar</h2>
    <p class="muted">Browsers can only notify you when the app is installed or open. A daily calendar event reminds you on any phone, even when the app is closed.</p>
    <div class="btn-row"><a class="btn" href="${rem.googleCalendarUrl()}" target="_blank" rel="noopener">📅 Add to Google Calendar</a>
    <button class="btn" data-act="ics">🍎 Apple / Outlook calendar (.ics)</button></div>
  </section>
  <section class="card">
    <h2>Install the app</h2>
    ${standalone ? `<p>✓ You're using the installed app.</p>`
      : installPrompt ? `<p class="muted">Install it on your home screen for one-tap access and background reminders.</p><button class="btn primary" data-act="install">Install app</button>`
      : ios ? `<p class="muted">On iPhone: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. Then open it from the home screen and allow notifications.</p>`
      : `<p class="muted">Use your browser menu → <strong>Install app</strong> / <strong>Add to Home screen</strong>.</p>`}
  </section>`;
}

/* ======================================================== settings == */
function viewSettings() {
  const st = state.settings;
  return `
  <section class="card">
    <h2>Profile</h2>
    <div class="row2">
      <label class="field"><span>Name</span><input data-set="name" value="${esc(st.name)}" autocomplete="name"></label>
      <label class="field"><span>Currency</span><select data-set="currency">${CURRENCIES.map(([c, n]) => `<option value="${c}" ${c === st.currency ? "selected" : ""}>${c} · ${n}</option>`).join("")}</select></label>
    </div>
    <div class="row2">
      <label class="field"><span>Theme</span><select data-set="theme">${[["auto", "Match my device"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<option value="${v}" ${v === st.theme ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <div class="field"><span>Strict planning</span><label class="check"><input type="checkbox" data-set="strict" ${st.strict ? "checked" : ""}> Make me cover overspending from another category</label></div>
    </div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Categories</h2><button class="btn sm" data-act="add-category">${icon("plus")} Add</button></div>
    <ul class="cat-manage">${state.categories.map((c) => `<li class="${c.archived ? "archived" : ""}"><button class="tx" data-act="edit-category" data-arg="${c.id}">
      <span class="tx-ic">${c.icon}</span><span class="tx-main"><span class="tx-title">${esc(c.name)}</span><span class="tx-sub">${c.kind === "need" ? "Need" : "Want"}${c.archived ? " · hidden" : ""}</span></span></button></li>`).join("")}</ul>
  </section>
  <section class="card">
    <h2>Account & security</h2>
    <p>${icon(auth.current.cloud ? "cloud" : "lock")} Signed in as <strong>${esc(auth.current.email)}</strong></p>
    <p class="small muted">${auth.current.cloud
      ? "Cloud account: your data syncs to your private Supabase space (only you can read it) and is cached encrypted on this device."
      : "Device account: your data is encrypted with your password and stored only in this browser. To use it on other devices, export a backup or switch on cloud accounts (see budget/README.md)."}</p>
    <div class="btn-row">
      <button class="btn" data-act="change-password">Change password</button>
      <button class="btn" data-act="sign-out">${icon("logout")} Sign out</button>
      <button class="btn ghost danger" data-act="delete-account">Delete account & data</button>
    </div>
  </section>
  <section class="card">
    <h2>AI assistant</h2>
    ${auth.aiEnabled ? `<p>✓ Connected. Your questions and a summary of your numbers go to your own private server function, which asks Claude (with web search) and returns the answer. Nothing is shared with anyone else, and chats are stored only in your account.</p>`
      : `<p class="muted">Right now “Ask AI” answers from your own numbers on this device. To add internet-powered answers: switch on cloud accounts, deploy the <code>budget-ai</code> function with your Anthropic API key, and set <code>aiEnabled: true</code> in <code>config.js</code>. Steps are in <code>budget/README.md</code>.</p>`}
  </section>
  <p class="small muted center">${esc(CONFIG.appName)} · your data, your device${auth.current.cloud ? ", your cloud" : ""}.</p>`;
}

/* ========================================================= dialogs == */
function expenseDialog(id) {
  const e = id ? state.expenses.find((x) => x.id === id) : null;
  const cats = activeCats();
  if (!cats.length) return toast("Add a category first (Settings → Categories).");
  const def = e?.catId || ui.lastCat || cats[0].id;
  const methods = ["Cash", "Card", "Transfer", "Mobile money", "Other"];
  openDialog(`
    <h2>${e ? "Edit expense" : "Add expense"}</h2>
    ${amountField("amount", e ? e.amount : "", "Amount", "required autofocus")}
    <fieldset class="field"><legend>Category</legend><div class="cat-grid">${cats.map((c) => `
      <label class="cat-pick"><input type="radio" name="catId" value="${c.id}" ${c.id === def ? "checked" : ""}><span><b>${c.icon}</b><small>${esc(c.name)}</small></span></label>`).join("")}</div></fieldset>
    <label class="field"><span>Description (optional)</span><input name="note" maxlength="80" value="${esc(e?.note || "")}" placeholder="e.g. Lunch with the team"></label>
    <div class="row2">
      <label class="field"><span>Date</span><input type="date" name="date" value="${e?.date || today()}" required></label>
      <label class="field"><span>Paid with</span><select name="method">${methods.map((m) => `<option ${m === (e?.method || ui.lastMethod || "Transfer") ? "selected" : ""}>${m}</option>`).join("")}</select></label>
    </div>
    <div id="strict-warn"></div>
    <div class="dlg-actions">${e ? `<button type="button" class="btn ghost danger" data-act="delete-expense" data-arg="${e.id}">Delete</button>` : ""}<span class="spacer"></span>
      <button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div>`,
  (fd, form) => {
    const amount = parseAmount(fd.get("amount"));
    if (!(amount > 0)) return fieldError(form, "Enter an amount above zero.");
    const catId = fd.get("catId");
    const date = fd.get("date") || today();
    const mk = date.slice(0, 7);
    const s = summary(mk);
    const already = (s.spentBy[catId] || 0) - (e && e.catId === catId && e.date.startsWith(mk) ? e.amount : 0);
    const over = round2(already + amount - (s.m.budgets[catId] || 0));
    if (state.settings.strict && hasPlan(mk) && over > 0 && !form.dataset.confirmed) {
      const donors = activeCats().map((c) => ({ c, left: round2((s.m.budgets[c.id] || 0) - (s.spentBy[c.id] || 0)) })).filter((d) => d.c.id !== catId && d.left > 0)
        .sort((a, b) => (a.c.kind === "need") - (b.c.kind === "need") || b.left - a.left); // take from wants before needs
      $("#strict-warn").innerHTML = `<div class="warnbox"><strong>⚠ This puts ${esc(cat(catId).name)} ${money(over)} over budget.</strong>
        <p class="small">Strict mode: cover it from another category so your month still balances.</p>
        ${donors.length ? `<label class="field"><span>Cover from</span><select name="cover">${donors.map((d) => `<option value="${d.c.id}">${d.c.icon} ${esc(d.c.name)} (${money(d.left)} left)</option>`).join("")}<option value="">Don't cover it (record as overspending)</option></select></label>`
          : `<p class="small">No category has money left, so it will be recorded as overspending.</p>`}</div>`;
      form.dataset.confirmed = "1";
      form.querySelector("button.primary").textContent = "Save";
      return false;
    }
    const cover = fd.get("cover");
    if (cover && over > 0) {
      const m = ensureMonth(mk);
      const avail = round2((m.budgets[cover] || 0) - (s.spentBy[cover] || 0));
      const amt = Math.min(over, avail);
      m.budgets[cover] = round2(m.budgets[cover] - amt);
      m.budgets[catId] = round2((m.budgets[catId] || 0) + amt);
    }
    const rec = { id: e?.id || uid(), date, amount, catId, note: fd.get("note").trim(), method: fd.get("method"), created: e?.created || Date.now() };
    if (e) Object.assign(e, rec); else state.expenses.push(rec);
    state.checkins[today()] = true;
    ui.lastCat = catId;
    ui.lastMethod = rec.method;
    save();
    renderView();
    const left = round2((summary(mk).m.budgets[catId] || 0) - (summary(mk).spentBy[catId] || 0));
    toast(e ? "Expense updated" : left >= 0 ? `Saved. ${cat(catId).name}: ${money(left)} left this month.` : `Saved. ${cat(catId).name} is ${money(-left)} over budget.`);
  },
  (form) => form.addEventListener("input", (ev) => {
    if (ev.target.name === "cover") return;
    delete form.dataset.confirmed;
    $("#strict-warn").innerHTML = "";
  }));
}
function deleteExpense(id) {
  const i = state.expenses.findIndex((e) => e.id === id);
  if (i < 0) return;
  const [e] = state.expenses.splice(i, 1);
  save();
  closeDialog();
  renderView();
  toast("Expense deleted", { label: "Undo", fn: () => { state.expenses.splice(i, 0, e); save(); renderView(); } });
}

function incomeDialog(id) {
  const mk = ui.month;
  const m = monthData(mk);
  const inc = id ? m.incomes.find((i) => i.id === id) : null;
  const defDate = mk === thisMonth() ? today() : mk + "-01";
  openDialog(`
    <h2>${inc ? "Edit income" : "Add income"}</h2>
    <label class="field"><span>Source</span><input name="source" required value="${esc(inc?.source || "")}" placeholder="e.g. Salary, freelance job, side business" autofocus></label>
    ${amountField("amount", inc ? inc.amount : "", "Amount")}
    <div class="row2">
      <label class="field"><span>Date</span><input type="date" name="date" value="${inc?.date || defDate}"></label>
      <label class="check self-end"><input type="checkbox" name="received" ${inc ? (inc.received ? "checked" : "") : "checked"}> Already received</label>
    </div>
    ${inc ? "" : `<label class="check"><input type="checkbox" name="repeat"> This repeats every month (adds it to future plans and the forecast)</label>`}
    <div class="dlg-actions">${inc ? `<button type="button" class="btn ghost danger" data-act="delete-income" data-arg="${inc.id}">Delete</button>` : ""}<span class="spacer"></span>
      <button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div>`,
  (fd, form) => {
    const amount = parseAmount(fd.get("amount"));
    const source = fd.get("source").trim();
    if (!source) return fieldError(form, "Where is this money from?");
    if (!(amount > 0)) return fieldError(form, "Enter an amount above zero.");
    const date = fd.get("date") || defDate;
    const target = ensureMonth(date.slice(0, 7));
    const rec = { id: inc?.id || uid(), source, amount, date, received: !!fd.get("received") };
    if (inc) {
      m.incomes.splice(m.incomes.indexOf(inc), 1);
      Object.assign(inc, rec);
      target.incomes.push(inc);
    } else target.incomes.push(rec);
    if (fd.get("repeat"))
      state.recurring.push({ id: uid(), name: source, type: "income", amount, every: "month", day: +date.slice(8), start: addMonths(date.slice(0, 7), 1), end: "" });
    save();
    renderView();
    toast(inc ? "Income updated" : `Income added. ${state.settings.strict ? "Now give it a job in your plan." : ""}`);
  });
}

function moveDialog(toId = "") {
  const mk = ui.month;
  const s = summary(mk);
  const m = monthData(mk);
  const avail = (id) => round2((m.budgets[id] || 0) - (s.spentBy[id] || 0));
  const need = toId && avail(toId) < 0 ? -avail(toId) : "";
  const opts = (sel, showLeft) => activeCats().map((c) => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${c.icon} ${esc(c.name)}${showLeft ? ` (${money(avail(c.id))} left)` : ""}</option>`).join("");
  const from = activeCats().filter((c) => c.id !== toId).sort((a, b) => avail(b.id) - avail(a.id))[0]?.id;
  openDialog(`
    <h2>Move money</h2>
    <p class="muted small">Shift budget between categories for ${monthName(mk)}. Your total plan stays the same.</p>
    <label class="field"><span>From</span><select name="from">${opts(from, true)}</select></label>
    <label class="field"><span>To</span><select name="to">${opts(toId || activeCats()[0]?.id, true)}</select></label>
    ${amountField("amount", need, "Amount", "autofocus")}
    <div class="dlg-actions"><span class="spacer"></span><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Move</button></div>`,
  (fd, form) => {
    const a = parseAmount(fd.get("amount"));
    const f = fd.get("from");
    const t = fd.get("to");
    if (f === t) return fieldError(form, "Pick two different categories.");
    if (!(a > 0)) return fieldError(form, "Enter an amount above zero.");
    const mm = ensureMonth(mk);
    if ((mm.budgets[f] || 0) < a) return fieldError(form, `${cat(f).name} only has ${money(mm.budgets[f] || 0)} budgeted.`);
    mm.budgets[f] = round2(mm.budgets[f] - a);
    mm.budgets[t] = round2((mm.budgets[t] || 0) + a);
    save();
    renderView();
    toast(`Moved ${money(a)} from ${cat(f).name} to ${cat(t).name}`);
  });
}

function contributeDialog(goalId = "", withdraw = false, cId = "") {
  const c = cId ? state.contributions.find((x) => x.id === cId) : null;
  if (!state.goals.length) return goalDialog();
  const gid = c?.goalId || goalId || state.goals[0].id;
  const out = c ? c.amount < 0 : withdraw;
  openDialog(`
    <h2>${c ? "Edit savings entry" : out ? "Withdraw from a goal" : "Add money to a goal"}</h2>
    <label class="field"><span>Goal</span><select name="goalId">${state.goals.map((g) => `<option value="${g.id}" ${g.id === gid ? "selected" : ""}>${g.icon || "🎯"} ${esc(g.name)} (${money(goalSaved(g))} saved)</option>`).join("")}</select></label>
    ${amountField("amount", c ? Math.abs(c.amount) : (!out && goalSuggestion(goal(gid)) || ""), "Amount", "autofocus")}
    <div class="row2"><label class="field"><span>Date</span><input type="date" name="date" value="${c?.date || today()}"></label>
    <label class="field"><span>Note (optional)</span><input name="note" value="${esc(c?.note || "")}" maxlength="60"></label></div>
    <input type="hidden" name="dir" value="${out ? "out" : "in"}">
    <div class="dlg-actions">${c ? `<button type="button" class="btn ghost danger" data-act="delete-contribution" data-arg="${c.id}">Delete</button>` : ""}<span class="spacer"></span>
      <button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${out ? "Withdraw" : "Save"}</button></div>`,
  (fd, form) => {
    const a = parseAmount(fd.get("amount"));
    if (!(a > 0)) return fieldError(form, "Enter an amount above zero.");
    const g = goal(fd.get("goalId"));
    const signed = fd.get("dir") === "out" ? -a : a;
    if (signed < 0 && goalSaved(g) + (c ? -c.amount : 0) + signed < -0.001) return fieldError(form, `${g.name} only has ${money(goalSaved(g))}.`);
    const rec = { id: c?.id || uid(), goalId: g.id, date: fd.get("date") || today(), amount: signed, note: fd.get("note").trim() };
    if (c) Object.assign(c, rec); else state.contributions.push(rec);
    state.checkins[today()] = true;
    save();
    renderView();
    const saved = goalSaved(g);
    toast(saved >= g.target ? `🎉 ${g.name} reached! Amazing discipline.` : `${g.name}: ${money(saved)} of ${money(g.target)}`);
  });
}

function goalDialog(id, preset = {}) {
  const g = id ? goal(id) : null;
  const icons = ["🛡️", "🏠", "🚗", "🎓", "✈️", "💍", "👶", "💻", "📱", "🏖️", "🏥", "📈", "🎁", "🎯"];
  const sel = g?.icon || preset.icon || "🎯";
  openDialog(`
    <h2>${g ? "Edit goal" : "New savings goal"}</h2>
    <label class="field"><span>What are you saving for?</span><input name="name" required value="${esc(g?.name || preset.name || "")}" placeholder="e.g. Emergency fund, new car, rent" autofocus></label>
    <fieldset class="field"><legend>Icon</legend><div class="icon-pick">${icons.map((i) => `<label><input type="radio" name="icon" value="${i}" ${i === sel ? "checked" : ""}><span>${i}</span></label>`).join("")}</div></fieldset>
    ${amountField("target", g?.target ?? preset.target ?? "", "Target amount")}
    <div class="row2">
      <label class="field"><span>Deadline (optional)</span><input type="month" name="deadline" value="${g?.deadline || preset.deadline || ""}" min="${thisMonth()}"></label>
      ${amountField("monthly", g?.monthly || "", "Or save per month")}
    </div>
    ${g ? "" : amountField("start", "", "Already saved (optional)")}
    <div class="dlg-actions">${g ? `<button type="button" class="btn ghost danger" data-act="delete-goal" data-arg="${g.id}">Delete</button>` : ""}<span class="spacer"></span>
      <button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div>`,
  (fd, form) => {
    const name = fd.get("name").trim();
    const target = parseAmount(fd.get("target"));
    if (!name) return fieldError(form, "Give your goal a name.");
    if (!(target > 0)) return fieldError(form, "Enter a target above zero.");
    const rec = { name, icon: fd.get("icon") || "🎯", target, deadline: fd.get("deadline") || "", monthly: parseAmount(fd.get("monthly")) || 0 };
    let gg = g;
    if (g) Object.assign(g, rec);
    else {
      gg = { id: uid(), created: thisMonth(), ...rec };
      state.goals.push(gg);
      const start = parseAmount(fd.get("start"));
      if (start > 0) state.contributions.push({ id: uid(), goalId: gg.id, date: today(), amount: start, note: "Starting balance" });
      const sug = goalSuggestion(gg);
      if (sug > 0 && hasPlan(thisMonth())) ensureMonth(thisMonth()).savings[gg.id] = sug;
    }
    save();
    renderView();
    const sug = goalSuggestion(gg);
    toast(g ? "Goal updated" : sug ? `Goal created. Save ${money(sug)} a month to stay on track.` : "Goal created");
  });
}

function recurringDialog(id) {
  const r = id ? state.recurring.find((x) => x.id === id) : null;
  openDialog(`
    <h2>${r ? "Edit recurring item" : "Add recurring income or bill"}</h2>
    <div class="seg small-seg"><label><input type="radio" name="type" value="expense" ${r?.type !== "income" ? "checked" : ""}><span>Bill / expense</span></label>
      <label><input type="radio" name="type" value="income" ${r?.type === "income" ? "checked" : ""}><span>Income</span></label></div>
    <label class="field"><span>Name</span><input name="name" required value="${esc(r?.name || "")}" placeholder="e.g. Rent, Netflix, Salary" autofocus></label>
    <div class="row2">${amountField("amount", r?.amount ?? "")}
      <label class="field"><span>How often</span><select name="every">${[["month", "Every month"], ["week", "Every week"], ["quarter", "Every 3 months"], ["year", "Every year"]].map(([v, l]) => `<option value="${v}" ${v === (r?.every || "month") ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <label class="field"><span>Category (bills)</span><select name="catId">${catOptions(r?.catId, { blank: true })}</select></label>
    <div class="row2">
      <label class="field"><span>Starts</span><input type="month" name="start" value="${r?.start || thisMonth()}"></label>
      <label class="field"><span>Ends (optional)</span><input type="month" name="end" value="${r?.end || ""}"></label>
    </div>
    <div class="dlg-actions">${r ? `<button type="button" class="btn ghost danger" data-act="delete-recurring" data-arg="${r.id}">Delete</button>` : ""}<span class="spacer"></span>
      <button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div>`,
  (fd, form) => {
    const amount = parseAmount(fd.get("amount"));
    const name = fd.get("name").trim();
    if (!name) return fieldError(form, "Give it a name.");
    if (!(amount > 0)) return fieldError(form, "Enter an amount above zero.");
    const rec = { name, type: fd.get("type"), amount, every: fd.get("every"), catId: fd.get("type") === "expense" ? fd.get("catId") : "", start: fd.get("start") || thisMonth(), end: fd.get("end") || "" };
    if (r) Object.assign(r, rec); else state.recurring.push({ id: uid(), day: 1, ...rec });
    save();
    renderView();
    toast("Saved. Your forecast is updated.");
  });
}

function plannedDialog(id, preset = {}) {
  const p = id ? state.planned.find((x) => x.id === id) : null;
  const v = { ...preset, ...(p || {}) };
  openDialog(`
    <h2>${p ? "Edit planned item" : "Plan a future cost or income"}</h2>
    <div class="seg small-seg"><label><input type="radio" name="type" value="expense" ${v.type !== "income" ? "checked" : ""}><span>Cost</span></label>
      <label><input type="radio" name="type" value="income" ${v.type === "income" ? "checked" : ""}><span>Money coming in</span></label></div>
    <label class="field"><span>What</span><input name="name" required value="${esc(v.name || "")}" placeholder="e.g. Rent renewal, school fees, bonus" autofocus></label>
    <div class="row2">${amountField("amount", v.amount ?? "")}
      <label class="field"><span>Month</span><input type="month" name="month" value="${v.month || addMonths(thisMonth(), 1)}" required></label></div>
    <label class="field"><span>Category (costs)</span><select name="catId">${catOptions(v.catId, { blank: true })}</select></label>
    <div class="dlg-actions">${p ? `<button type="button" class="btn ghost danger" data-act="delete-planned" data-arg="${p.id}">Delete</button>` : ""}<span class="spacer"></span>
      <button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div>`,
  (fd, form) => {
    const amount = parseAmount(fd.get("amount"));
    const name = fd.get("name").trim();
    if (!name) return fieldError(form, "What is it?");
    if (!(amount > 0)) return fieldError(form, "Enter an amount above zero.");
    const rec = { name, type: fd.get("type"), amount, month: fd.get("month"), catId: fd.get("type") === "expense" ? fd.get("catId") : "" };
    if (p) Object.assign(p, rec); else state.planned.push({ id: uid(), ...rec });
    save();
    renderView();
    toast("Planned. It's now in your forecast.");
  });
}

function categoryDialog(id) {
  const c = id ? state.categories.find((x) => x.id === id) : null;
  const used = c && (state.expenses.some((e) => e.catId === c.id) || Object.values(state.months).some((m) => m.budgets[c.id] > 0));
  openDialog(`
    <h2>${c ? "Edit category" : "New category"}</h2>
    <label class="field"><span>Name</span><input name="name" required value="${esc(c?.name || "")}" autofocus maxlength="40"></label>
    <fieldset class="field"><legend>Icon</legend><div class="icon-pick">${ICONS.map((i) => `<label><input type="radio" name="icon" value="${i}" ${i === (c?.icon || "📦") ? "checked" : ""}><span>${i}</span></label>`).join("")}</div></fieldset>
    <div class="seg small-seg"><label><input type="radio" name="kind" value="need" ${c?.kind === "need" ? "checked" : ""}><span>Need</span></label>
      <label><input type="radio" name="kind" value="want" ${c?.kind !== "need" ? "checked" : ""}><span>Want</span></label></div>
    ${c ? `<label class="check"><input type="checkbox" name="archived" ${c.archived ? "checked" : ""}> Hide this category (keeps its history)</label>` : ""}
    <div class="dlg-actions">${c && !used ? `<button type="button" class="btn ghost danger" data-act="delete-category" data-arg="${c.id}">Delete</button>` : ""}<span class="spacer"></span>
      <button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div>`,
  (fd, form) => {
    const name = fd.get("name").trim();
    if (!name) return fieldError(form, "Give it a name.");
    if (c) Object.assign(c, { name, icon: fd.get("icon"), kind: fd.get("kind"), archived: !!fd.get("archived") });
    else addCategory(name, fd.get("icon"), fd.get("kind"));
    save();
    renderView();
  });
}

function passwordDialog() {
  openDialog(`
    <h2>Change password</h2>
    <label class="field"><span>Current password</span><input type="password" name="old" autocomplete="current-password" required autofocus></label>
    <label class="field"><span>New password</span><input type="password" name="new" autocomplete="new-password" required minlength="8"></label>
    <label class="field"><span>Repeat new password</span><input type="password" name="again" autocomplete="new-password" required></label>
    <div class="dlg-actions"><span class="spacer"></span><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Change</button></div>`,
  async (fd, form) => {
    if (fd.get("new") !== fd.get("again")) return fieldError(form, "The new passwords don't match.");
    try {
      await auth.changePassword(fd.get("old"), fd.get("new"), () => state);
      toast("Password changed");
    } catch (e) { return fieldError(form, e.message); }
  });
}

function recoveryDialog() {
  openDialog(`
    <h2>Set a new password</h2>
    <label class="field"><span>New password</span><input type="password" name="new" autocomplete="new-password" required minlength="8" autofocus></label>
    <div class="dlg-actions"><span class="spacer"></span><button class="btn primary">Save and sign in</button></div>`,
  async (fd, form) => {
    try {
      await auth.completeRecovery(fd.get("new"));
      await enterApp();
      toast("Password updated. Welcome back!");
    } catch (e) { return fieldError(form, e.message); }
  });
}

/* ========================================================= actions == */
function pickFile(accept) {
  return new Promise((resolve) => {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = accept;
    i.onchange = () => resolve(i.files[0] || null);
    i.click();
  });
}
const actions = {
  "go": (el) => go(el.dataset.arg),
  "open-menu": () => document.body.classList.add("menu-open"),
  "close-menu": () => document.body.classList.remove("menu-open"),
  "month": (el) => { ui.month = addMonths(ui.month, +el.dataset.d); renderView(); },
  "month-now": () => { ui.month = thisMonth(); renderView(); },
  "auth-tab": (el) => { ui.authTab = el.dataset.tab; renderAuth(); },
  "toggle-pw": (el) => { const i = el.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; el.textContent = i.type === "password" ? "Show" : "Hide"; },
  async "forgot"() {
    const email = $("#auth-form [name=email]").value;
    if (auth.cloudEnabled) {
      if (!email) return toast("Type your email first, then tap “Forgot password?”");
      try { await auth.requestPasswordReset(email); toast("Check your email for a reset link."); } catch (e) { toast(e.message); }
      return;
    }
    if (await askConfirm("Forgot your password?", "Device accounts are encrypted with your password, so it can't be recovered.\n\nYou can remove this account from this device and start fresh, then restore a backup file if you have one. Remove the account for " + (email || "this email") + "?", { ok: "Remove account", danger: true }))
      if (email && auth.forgetDeviceAccount(email)) { ui.authTab = "up"; renderAuth("Account removed. Create it again, then restore your backup from Reports & export."); }
      else toast("No account with that email on this device.");
  },
  async "sign-out"() { await auth.signOut(); ui.authTab = "in"; state.chat = []; renderAuth("You're signed out."); },
  "toggle-balance": () => { state.settings.hideBalance = !state.settings.hideBalance; save(); renderView(); },
  "add-expense": () => expenseDialog(),
  "edit-expense": (el) => expenseDialog(el.dataset.arg),
  "delete-expense": (el) => deleteExpense(el.dataset.arg),
  "no-spend": () => { state.checkins[today()] = true; save(); renderView(); toast(`Nice! ${streakDays() > 1 ? `${streakDays()}-day streak 🔥` : "Checked in for today."}`); },
  "add-income": () => incomeDialog(),
  "edit-income": (el) => incomeDialog(el.dataset.arg),
  "delete-income": (el) => {
    for (const m of Object.values(state.months)) m.incomes = m.incomes.filter((i) => i.id !== el.dataset.arg);
    save(); closeDialog(); renderView(); toast("Income removed");
  },
  "toggle-received": (el) => {
    const i = monthData(ui.month).incomes.find((x) => x.id === el.dataset.arg);
    if (i) { i.received = el.checked; save(); renderView(); }
  },
  "move-money": (el) => moveDialog(el.dataset.arg || ""),
  "contribute": (el) => contributeDialog(el.dataset.arg || ""),
  "withdraw": (el) => contributeDialog(el.dataset.arg, true),
  "edit-contribution": (el) => contributeDialog("", false, el.dataset.arg),
  "delete-contribution": (el) => { state.contributions = state.contributions.filter((c) => c.id !== el.dataset.arg); save(); closeDialog(); renderView(); },
  "add-goal": () => goalDialog(),
  "edit-goal": (el) => goalDialog(el.dataset.arg),
  "quick-emergency": (el) => goalDialog(null, { name: "Emergency fund", icon: "🛡️", target: round2(+el.dataset.arg) }),
  async "delete-goal"(el) {
    const g = goal(el.dataset.arg);
    if (!(await askConfirm("Delete goal?", `Delete “${g.name}” and its ${money(goalSaved(g))} of savings history?`, { ok: "Delete", danger: true }))) return;
    state.goals = state.goals.filter((x) => x.id !== g.id);
    state.contributions = state.contributions.filter((c) => c.goalId !== g.id);
    for (const m of Object.values(state.months)) delete m.savings[g.id];
    save(); closeDialog(); renderView();
  },
  "use-suggested": () => {
    const m = ensureMonth(ui.month);
    for (const g of state.goals) m.savings[g.id] = goalSuggestion(g, ui.month);
    save(); renderView();
  },
  "start-month": () => { startMonth(ui.month); save(); renderView(); toast(`${monthName(ui.month)} is planned. Check the numbers.`); },
  "start-fresh": () => { ensureMonth(ui.month); renderView(); incomeDialog(); },
  "copy-last": () => {
    const prev = monthData(addMonths(ui.month, -1));
    if (!Object.keys(prev.budgets).length) return toast("Last month has no budgets to copy.");
    const m = ensureMonth(ui.month);
    m.budgets = { ...prev.budgets };
    save(); renderView(); toast("Copied last month's budgets");
  },
  async "clear-plan"() {
    if (!(await askConfirm("Clear this plan?", `This clears the budgets and savings plan for ${monthName(ui.month)}. Your expenses and income stay.`, { ok: "Clear plan", danger: true }))) return;
    const m = ensureMonth(ui.month);
    m.budgets = {};
    m.savings = {};
    save(); renderView();
  },
  "add-category": () => categoryDialog(),
  "edit-category": (el) => categoryDialog(el.dataset.arg),
  "delete-category": (el) => { state.categories = state.categories.filter((c) => c.id !== el.dataset.arg); save(); closeDialog(); renderView(); },
  "add-recurring": () => recurringDialog(),
  "edit-recurring": (el) => recurringDialog(el.dataset.arg),
  "delete-recurring": (el) => { state.recurring = state.recurring.filter((r) => r.id !== el.dataset.arg); save(); closeDialog(); renderView(); },
  "add-planned": () => plannedDialog(),
  "edit-planned": (el) => plannedDialog(el.dataset.arg),
  "delete-planned": (el) => { state.planned = state.planned.filter((p) => p.id !== el.dataset.arg); save(); closeDialog(); renderView(); },
  "whatif-plan": (el) => plannedDialog(null, { name: el.dataset.name, amount: +el.dataset.amount, month: el.dataset.month, type: "expense" }),
  "whatif-goal": (el) => goalDialog(null, { name: el.dataset.name, target: +el.dataset.amount, deadline: el.dataset.month }),
  "ask": (el) => sendQuestion(el.dataset.arg),
  async "clear-chat"() { if (await askConfirm("Clear this conversation?", "Your questions and answers will be removed.", { ok: "Clear" })) { state.chat = []; save(); renderView(); } },
  "export-xlsx": async () => { toast("Preparing your Excel file…"); try { await exportExcel(); } catch (e) { toast("Couldn't build the Excel file. Check your connection and try again."); } },
  "export-csv": () => exportCSV(),
  "export-backup": () => exportBackup(),
  async "restore-backup"() {
    const f = await pickFile(".json,application/json");
    if (!f) return;
    try {
      const data = await readBackup(f);
      if (!(await askConfirm("Restore this backup?", `This replaces all of this account's data with the backup from “${f.name}”.`, { ok: "Restore", danger: true }))) return;
      setState(data);
      state.settings.setupDone = true;
      save();
      openApp();
      toast("Backup restored");
    } catch (e) { toast(e.message || "That file couldn't be read."); }
  },
  async "email-report"() {
    toast("Preparing your report…");
    const s = summary(ui.month);
    const text = `Budget report for ${monthName(ui.month)}\nIncome: ${money(s.income)}\nSpent: ${money(s.spent)}\nSaved: ${money(s.saved)}\nMoney left: ${money(s.balance)}`;
    try {
      const r = await emailReport(auth.current.email, text);
      if (r === "shared") toast("Sent to your share sheet");
    } catch { toast("Couldn't prepare the file. Check your connection and try again."); }
  },
  async "toggle-reminders"(el) {
    if (el.checked) {
      const p = await rem.enable();
      if (p === "denied") toast("Notifications are blocked. Use the calendar option below, or allow them in your browser settings.");
      else if (p === "unsupported") toast("This browser can't show notifications. Use the calendar option below.");
      else toast(`Daily reminder set for ${state.settings.reminderTime}`);
    } else rem.disable();
    save();
    renderView();
  },
  "toggle-reminders-on": async () => { await rem.enable(); save(); renderView(); },
  "test-notify": async () => { const m = rem.message(); if (!(await rem.notify(m.title, m.body))) toast("Couldn't show a notification here."); },
  "ics": () => rem.downloadICS(),
  async "install"() { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; renderView(); },
  "change-password": () => passwordDialog(),
  async "delete-account"() {
    if (!(await askConfirm("Delete account?", "This deletes your account and ALL your budget data. It can't be undone, so export a backup first if you might want it.", { ok: "Delete everything", danger: true, typed: "DELETE" }))) return;
    await auth.deleteAccount();
    ui.authTab = "up";
    renderAuth("Your account and data were deleted.");
  }
};

/* ========================================================== events == */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closeDialog();
  if (e.target === dlg()) return closeDialog(); // backdrop
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  if (el.tagName !== "INPUT") e.preventDefault();
  fn(el, e);
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.budget || t.dataset.saving) {
    const m = ensureMonth(ui.month);
    const v = parseAmount(t.value);
    const bag = t.dataset.budget ? m.budgets : m.savings;
    const key = t.dataset.budget || t.dataset.saving;
    if (v > 0) bag[key] = v; else delete bag[key];
    save();
    updatePlanLive();
  } else if (t.id === "tx-search") {
    ui.q = t.value;
    $("#tx-groups").innerHTML = txGroups();
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "tx-cat") { ui.txCat = t.value; $("#tx-groups").innerHTML = txGroups(); return; }
  const key = t.dataset.set;
  if (!key) return;
  const st = state.settings;
  if (key === "strict") st.strict = t.checked;
  else if (key === "balance" || key === "everyday") { const v = parseAmount(t.value); st[key] = t.value.trim() === "" || !Number.isFinite(v) ? null : v; }
  else st[key] = t.value;
  if (key === "currency") setCurrency(st.currency);
  if (key === "theme") applyTheme();
  if (key === "reminderTime") rem.schedule();
  if (key === "name") renderShell();
  save();
  renderView();
});
document.addEventListener("submit", (e) => {
  const f = e.target.closest("[data-form]");
  if (!f) return;
  e.preventDefault();
  const fd = new FormData(f);
  if (f.dataset.form === "chat") sendQuestion(fd.get("q") || "");
  if (f.dataset.form === "whatif") {
    const amount = parseAmount(fd.get("amount"));
    const name = (fd.get("name") || "").trim() || "This purchase";
    if (!(amount > 0)) return ($("#whatif-out").innerHTML = `<p class="res bad">Enter an amount above zero.</p>`);
    $("#whatif-out").innerHTML = whatIfResult(name, amount, fd.get("month") || addMonths(thisMonth(), 1));
  }
});
const onNav = () => { const v = location.hash.slice(1); if (VIEWS[v] && v !== ui.view && document.body.classList.contains("in")) go(v, false); };
addEventListener("popstate", onNav);
addEventListener("hashchange", onNav);
addEventListener("keydown", (e) => { if (e.key === "Escape") document.body.classList.remove("menu-open"); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && document.body.classList.contains("in")) { renderView(); rem.schedule(); }
  else if (document.visibilityState === "hidden") auth.flush();
});
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e; });

/* Tooltip for chart marks (hover with a mouse, tap or focus elsewhere) */
const tip = () => $("#tip");
function showTip(el, x, y) {
  const t = tip();
  t.innerHTML = el.dataset.tip;
  t.hidden = false;
  const r = t.getBoundingClientRect();
  t.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width / 2)) + "px";
  t.style.top = Math.max(8, y - r.height - 12) + "px";
}
document.addEventListener("pointermove", (e) => {
  const el = e.target.closest?.("[data-tip]");
  if (el) showTip(el, e.clientX, e.clientY); else if (!tip().hidden) tip().hidden = true;
});
document.addEventListener("focusin", (e) => {
  const el = e.target.closest?.("[data-tip]");
  if (el) { const r = el.getBoundingClientRect(); showTip(el, r.left + r.width / 2, r.top); } else tip().hidden = true;
});
addEventListener("scroll", () => { tip().hidden = true; }, { passive: true });

/* ============================================================ boot == */
auth.onRecovery(() => recoveryDialog());
(async function boot() {
  const params = new URLSearchParams(location.search);
  const confirmed = params.has("code") || /type=signup/.test(location.hash);
  try {
    const user = await auth.restore();
    if (user) return enterApp();
  } catch (e) { console.error(e); }
  if (confirmed) history.replaceState(null, "", location.pathname);
  ui.authTab = auth.hasLocalAccounts() || auth.lastEmail() ? "in" : "up";
  renderAuth(confirmed ? "Email confirmed. Sign in to continue." : "");
})();

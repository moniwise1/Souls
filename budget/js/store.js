// The data model and every calculation the screens show.
// `state` is one plain object; auth.js encrypts and saves it.

import {
  uid, round2, sum, today, thisMonth, addMonths, monthDiff, daysInMonth, daysBetween, monthName, money, guessCurrency
} from "./util.js";

export const DEFAULT_CATEGORIES = [
  // name, icon, kind, share of the needs/wants pot used by the 50/30/20 starter plan
  ["Rent & housing", "🏠", "need", 0.33],
  ["Food & groceries", "🛒", "need", 0.24],
  ["Transport & fuel", "🚌", "need", 0.12],
  ["Power, water & bills", "💡", "need", 0.08],
  ["Phone & internet", "📱", "need", 0.05],
  ["Health", "🩺", "need", 0.05],
  ["Family & support", "👪", "need", 0.07],
  ["Education", "📚", "need", 0.06],
  ["Debt repayment", "💳", "need", 0],
  ["Eating out", "🍲", "want", 0.28],
  ["Shopping & clothes", "🛍️", "want", 0.24],
  ["Fun & entertainment", "🎬", "want", 0.18],
  ["Personal care", "💇", "want", 0.15],
  ["Giving & tithe", "🙏", "want", 0.15],
  ["Other", "📦", "want", 0]
];
export const ICONS = ["🏠","🛒","🚌","⛽","💡","📱","🩺","👪","📚","💳","🍲","☕","🛍️","🎬","💇","🙏","📦","🎁","✈️","🚗","🐶","👶","🏋️","💼","🧾","🔧","🎓","🏥","💍","🎮","📺","🧴","🪙","🏦","📈","🛡️","🎯","🏖️","🏡","💻"];

export function freshState() {
  return {
    v: 1,
    settings: {
      name: "",
      currency: guessCurrency(),
      theme: "auto",
      strict: true,
      hideBalance: false,
      remindersOn: false,
      reminderTime: "20:00",
      lastNotified: null,
      balance: null, // money on hand, for the forecast; null = work it out from this month
      everyday: null, // everyday spending per month, for the forecast; null = estimate it
      setupDone: false
    },
    categories: [],
    months: {}, // "YYYY-MM": { incomes: [], budgets: {catId: amount}, savings: {goalId: amount} }
    expenses: [], // { id, date, amount, catId, note, method, created }
    goals: [], // { id, name, icon, target, deadline: "YYYY-MM" | "", monthly, created: "YYYY-MM" }
    contributions: [], // { id, goalId, date, amount (negative = withdrawal), note }
    recurring: [], // { id, name, type: income|expense, amount, every: month|week|quarter|year, catId, start, end }
    planned: [], // one-offs: { id, name, type, amount, month, catId }
    checkins: {}, // "YYYY-MM-DD": true
    chat: [] // { role: user|assistant, text, at }
  };
}

export let state = freshState();
export function setState(s) {
  state = migrate(s);
  return state;
}
export function migrate(s) {
  const f = freshState();
  const out = { ...f, ...(s || {}), settings: { ...f.settings, ...((s && s.settings) || {}) } };
  for (const k of ["categories", "expenses", "goals", "contributions", "recurring", "planned", "chat"])
    if (!Array.isArray(out[k])) out[k] = [];
  if (!out.months || typeof out.months !== "object") out.months = {};
  if (!out.checkins || typeof out.checkins !== "object") out.checkins = {};
  for (const m of Object.values(out.months)) {
    m.incomes ||= [];
    m.budgets ||= {};
    m.savings ||= {};
  }
  return out;
}

/* --------------------------------------------------------- lookups -- */
const UNKNOWN = { id: "", name: "Deleted category", icon: "❔", kind: "want" };
export const cat = (id) => state.categories.find((c) => c.id === id) || UNKNOWN;
export const activeCats = () => state.categories.filter((c) => !c.archived);
export const goal = (id) => state.goals.find((g) => g.id === id);
export const monthData = (mk) => state.months[mk] || { incomes: [], budgets: {}, savings: {} };
export const ensureMonth = (mk) => (state.months[mk] ||= { incomes: [], budgets: {}, savings: {} });
export function hasPlan(mk) {
  const m = state.months[mk];
  return !!m && (m.incomes.length > 0 || Object.values(m.budgets).some((v) => v > 0));
}
export const expensesIn = (mk) => state.expenses.filter((e) => e.date.startsWith(mk));
export const contributionsIn = (mk) => state.contributions.filter((c) => c.date.startsWith(mk));
export const byDateDesc = (a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0);

export function addCategory(name, icon = "📦", kind = "want") {
  const c = { id: uid(), name: name.trim(), icon, kind };
  state.categories.push(c);
  return c;
}

/* ----------------------------------------------------- month summary -- */
export function summary(mk) {
  const m = monthData(mk);
  const exps = expensesIn(mk);
  const cur = thisMonth();
  const income = sum(m.incomes, (i) => i.amount);
  const received = sum(m.incomes.filter((i) => i.received), (i) => i.amount);
  const budgeted = sum(Object.values(m.budgets));
  const savingsPlan = sum(Object.values(m.savings));
  const spentBy = {};
  for (const e of exps) spentBy[e.catId] = round2((spentBy[e.catId] || 0) + e.amount);
  const spent = sum(exps, (e) => e.amount);
  const saved = sum(contributionsIn(mk), (c) => c.amount);
  const dim = daysInMonth(mk);
  const isCur = mk === cur;
  const day = isCur ? new Date().getDate() : mk < cur ? dim : 0;
  const daysLeft = isCur ? dim - day + 1 : mk > cur ? dim : 0;
  const budgetLeft = round2(budgeted - spent);
  const balance = round2(income - spent - saved); // the bank-style "money left" that drops as you spend
  const ids = new Set([...Object.keys(m.budgets).filter((id) => m.budgets[id] > 0), ...Object.keys(spentBy)]);
  const rows = [...ids].map((id) => {
    const budget = m.budgets[id] || 0;
    const s = spentBy[id] || 0;
    const pct = budget > 0 ? s / budget : s > 0 ? Infinity : 0;
    let status = "ok";
    if (s > budget + 0.001) status = "over";
    else if (budget > 0 && pct >= 0.9) status = "warn";
    else if (isCur && budget > 0 && pct >= 0.5 && pct > day / dim + 0.15) status = "pace";
    return { id, cat: cat(id), budget, spent: s, left: round2(budget - s), pct, status };
  }).sort((a, b) => b.budget - a.budget || b.spent - a.spent);
  return {
    mk, m, income, received, budgeted, savingsPlan, spent, saved, spentBy, rows, dim, day, daysLeft, isCur,
    budgetLeft, balance,
    unassigned: round2(income - budgeted - savingsPlan),
    perDay: daysLeft > 0 ? round2(Math.max(0, Math.min(budgetLeft, balance)) / daysLeft) : 0,
    count: exps.length
  };
}

/* ----------------------------------------------------------- goals -- */
export const goalSaved = (g, before = null) =>
  sum(state.contributions.filter((c) => c.goalId === g.id && (!before || c.date < before + "-01")), (c) => c.amount);

/** What to put into a goal in month mk to reach it on time. */
export function goalSuggestion(g, mk = thisMonth()) {
  const rem = g.target - goalSaved(g, mk);
  if (rem <= 0) return 0;
  if (g.deadline) {
    if (mk > g.deadline) return round2(rem);
    return round2(rem / (monthDiff(mk, g.deadline) + 1));
  }
  return round2(Math.min(rem, g.monthly || 0));
}
export function goalStatus(g) {
  const saved = goalSaved(g);
  if (saved >= g.target) return { key: "done", label: "Reached 🎉" };
  if (!g.deadline) return { key: "open", label: g.monthly ? `${money(g.monthly)}/month` : "No deadline" };
  const cur = thisMonth();
  if (cur > g.deadline) return { key: "late", label: "Deadline passed" };
  const total = Math.max(1, monthDiff(g.created || cur, g.deadline) + 1);
  const gone = Math.max(0, monthDiff(g.created || cur, cur));
  const expected = (gone / total) * g.target;
  return saved + 0.001 < expected - g.target * 0.08
    ? { key: "behind", label: `Behind by ${money(expected - saved)}` }
    : { key: "ok", label: "On track" };
}

/* ------------------------------------------------- daily check-ins -- */
export function streakDays() {
  let d = new Date();
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  if (!state.checkins[iso(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (state.checkins[iso(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function lastCheckin() {
  const days = Object.keys(state.checkins).sort();
  return days[days.length - 1] || null;
}

/* ---------------------------------------------- recurring & forecast -- */
export function recurringAmount(r, mk) {
  const start = r.start || thisMonth();
  if (mk < start || (r.end && mk > r.end)) return 0;
  const d = monthDiff(start, mk);
  const f = { month: 1, week: 52 / 12, quarter: d % 3 === 0 ? 1 : 0, year: d % 12 === 0 ? 1 : 0 }[r.every] ?? 1;
  return round2(r.amount * f);
}
const recurringTotal = (type, mk) => sum(state.recurring.filter((r) => r.type === type), (r) => recurringAmount(r, mk));
const plannedTotal = (type, mk, list = state.planned) => sum(list.filter((p) => p.type === type && p.month === mk), (p) => p.amount);

export function autoEveryday() {
  const cur = thisMonth();
  const past = [1, 2, 3].map((n) => addMonths(cur, -n)).filter((mk) => expensesIn(mk).length > 0);
  if (past.length)
    return Math.max(0, round2(sum(past, (mk) => summary(mk).spent - recurringTotal("expense", mk) - plannedTotal("expense", mk)) / past.length));
  const s = summary(cur);
  return Math.max(0, round2(Math.max(s.budgeted, s.spent) - recurringTotal("expense", cur) - plannedTotal("expense", cur)));
}
export const everydayEstimate = () => (state.settings.everyday != null ? state.settings.everyday : autoEveryday());

export function autoStartBalance() {
  const cur = thisMonth();
  if (!hasPlan(cur)) return 0;
  const s = summary(cur);
  const committed = sum(s.rows, (r) => Math.max(r.budget, r.spent));
  return round2(s.income - Math.max(s.savingsPlan, s.saved) - committed);
}
export const startBalance = () => (state.settings.balance != null ? state.settings.balance : autoStartBalance());

/** Month-by-month projection from next month on. `extra` = what-if items. */
export function forecast(extra = [], months = 12) {
  const cur = thisMonth();
  const list = [...state.planned, ...extra];
  const every = everydayEstimate();
  const remaining = new Map(state.goals.map((g) => [g.id, Math.max(0, g.target - goalSaved(g))]));
  let balance = startBalance();
  let pot = sum(state.goals, (g) => goalSaved(g));
  const rows = [];
  for (let i = 1; i <= months; i++) {
    const mk = addMonths(cur, i);
    const income = round2(recurringTotal("income", mk) + plannedTotal("income", mk, list));
    const bills = recurringTotal("expense", mk);
    const oneoff = plannedTotal("expense", mk, list);
    let savings = 0;
    for (const g of state.goals) {
      const r = remaining.get(g.id);
      if (!(r > 0)) continue;
      let c = g.deadline ? (mk <= g.deadline ? r / (monthDiff(mk, g.deadline) + 1) : 0) : Math.min(r, g.monthly || 0);
      c = round2(c);
      remaining.set(g.id, r - c);
      savings += c;
    }
    savings = round2(savings);
    const net = round2(income - bills - oneoff - every - savings);
    balance = round2(balance + net);
    pot = round2(pot + savings);
    rows.push({ mk, income, bills, oneoff, everyday: every, savings, net, balance, pot, items: list.filter((p) => p.month === mk) });
  }
  return rows;
}

/** Can I afford `amount` in month `mk`? */
export function whatIf(name, amount, mk) {
  const cur = thisMonth();
  const base = forecast();
  const alt = forecast([{ type: "expense", amount, month: mk, name }]);
  const minOf = (rows) => rows.reduce((m, r) => (r.balance < m.balance ? r : m), rows[0]);
  const firstShort = alt.find((r) => r.balance < 0);
  const monthsAway = Math.max(1, monthDiff(cur, mk));
  let earliest = null;
  for (const r of base) {
    const test = forecast([{ type: "expense", amount, month: r.mk, name }]);
    if (test.every((x) => x.balance >= 0)) { earliest = r.mk; break; }
  }
  return { base, alt, low: minOf(alt), firstShort, perMonth: round2(amount / monthsAway), monthsAway, earliest, ok: !firstShort };
}

/* --------------------------------------------------- start a month -- */
/** Build a month's plan from last month, recurring items, planned one-offs and goals. */
export function startMonth(mk, { fresh = false } = {}) {
  const m = ensureMonth(mk);
  const prevKey = Object.keys(state.months).filter((k) => k < mk && hasPlan(k)).sort().pop();
  const prev = prevKey ? state.months[prevKey] : null;
  const recIncome = state.recurring.filter((r) => r.type === "income" && recurringAmount(r, mk) > 0);
  const [y, mo] = mk.split("-");
  const dateFor = (day) => `${y}-${mo}-${String(Math.min(Math.max(1, day || 1), daysInMonth(mk))).padStart(2, "0")}`;
  if (!m.incomes.length) {
    if (recIncome.length)
      m.incomes = recIncome.map((r) => ({ id: uid(), source: r.name, amount: recurringAmount(r, mk), date: dateFor(r.day), received: false, recurringId: r.id }));
    else if (prev && !fresh)
      m.incomes = prev.incomes.map((i) => ({ ...i, id: uid(), date: dateFor(+i.date.slice(8)), received: false }));
    for (const p of state.planned.filter((p) => p.type === "income" && p.month === mk))
      m.incomes.push({ id: uid(), source: p.name, amount: p.amount, date: dateFor(1), received: false, plannedId: p.id });
  }
  if (!fresh && prev) for (const [id, v] of Object.entries(prev.budgets)) if (!(m.budgets[id] > 0)) m.budgets[id] = v;
  for (const r of state.recurring.filter((r) => r.type === "expense" && r.catId)) {
    const a = recurringAmount(r, mk);
    if (a > 0 && !(m.budgets[r.catId] >= a)) m.budgets[r.catId] = a;
  }
  for (const p of state.planned.filter((p) => p.type === "expense" && p.month === mk && p.catId))
    m.budgets[p.catId] = round2((m.budgets[p.catId] || 0) + p.amount);
  for (const g of state.goals) {
    const s = goalSuggestion(g, mk);
    if (s > 0 && !(m.savings[g.id] > 0)) m.savings[g.id] = s;
  }
  return m;
}

/** First-run plan: 50% needs, 30% wants, 20% savings, rounded to tidy numbers. */
export function starterPlan(mk, income, emergencyGoalId) {
  const m = ensureMonth(mk);
  const step = income >= 100000 ? 1000 : income >= 10000 ? 100 : income >= 1000 ? 10 : 1;
  const tidy = (v) => Math.floor(v / step) * step;
  const savings = tidy(income * 0.2);
  const pots = { need: income * 0.5, want: income * 0.3 };
  for (const kind of ["need", "want"]) {
    const cats = activeCats().filter((c) => c.kind === kind && c.weight > 0);
    const w = cats.reduce((a, c) => a + c.weight, 0);
    for (const c of cats) m.budgets[c.id] = tidy((pots[kind] * c.weight) / w);
  }
  if (emergencyGoalId) m.savings[emergencyGoalId] = savings;
  // whatever rounding left over goes to the biggest need so the plan balances exactly
  const left = round2(income - sum(Object.values(m.budgets)) - savings);
  const biggest = Object.entries(m.budgets).sort((a, b) => b[1] - a[1])[0];
  if (biggest) m.budgets[biggest[0]] = round2(biggest[1] + left);
  else if (emergencyGoalId) m.savings[emergencyGoalId] = round2(savings + left);
}

/* ------------------------------------------------ partner insights -- */
/** The "money partner" messages: each has a level (bad/warn/info/good), text and an optional action. */
export function insights(mk) {
  const out = [];
  const s = summary(mk);
  const cur = thisMonth();
  if (!hasPlan(mk)) {
    out.push({ lvl: "info", icon: "🗓️", text: `You don't have a plan for ${monthName(mk)} yet. Two minutes now saves a stressful month.`, act: "go", arg: "plan", label: "Plan it" });
    if (mk !== cur) return out;
  }
  if (hasPlan(mk) && s.income === 0)
    out.push({ lvl: "warn", icon: "💼", text: "Add your income for this month so every expense is measured against it.", act: "add-income", label: "Add income" });
  if (s.unassigned > 0.009 && s.income > 0)
    out.push({ lvl: "warn", icon: "🧩", text: `${money(s.unassigned)} of your income has no job yet. Give it a category or a savings goal.`, act: "go", arg: "plan", label: "Assign" });
  if (s.unassigned < -0.009)
    out.push({ lvl: "bad", icon: "⚖️", text: `Your plan is ${money(-s.unassigned)} more than your income. Trim a category so it balances.`, act: "go", arg: "plan", label: "Fix plan" });
  for (const r of s.rows) {
    const n = `${r.cat.icon} ${r.cat.name}`;
    if (r.status === "over" && r.budget > 0)
      out.push({ lvl: "bad", icon: "🚨", text: `${n} is over budget by ${money(-r.left)}. Cover it from another category so the month still balances.`, act: "move-money", arg: r.id, label: "Cover it" });
    else if (r.status === "over")
      out.push({ lvl: "bad", icon: "🚨", text: `You spent ${money(r.spent)} on ${n} with no budget for it.`, act: "move-money", arg: r.id, label: "Budget it" });
    else if (r.status === "warn")
      out.push({ lvl: "warn", icon: "⚠️", text: `${n}: only ${money(r.left)} left (${Math.round(r.pct * 100)}% used).` });
    else if (r.status === "pace" && s.daysLeft > 0)
      out.push({ lvl: "warn", icon: "🏃", text: `${n} is running ahead of the month: ${Math.round(r.pct * 100)}% spent with ${Math.round((s.day / s.dim) * 100)}% of the month gone. Keep it to about ${money(r.left / s.daysLeft)} a day.` });
  }
  if (mk === cur) {
    const t = today();
    const last = lastCheckin();
    const [hh] = (state.settings.reminderTime || "20:00").split(":").map(Number);
    if (last && last !== t && daysBetween(last, t) >= 2)
      out.push({ lvl: "warn", icon: "📝", text: `It's been ${daysBetween(last, t)} days since you logged anything. Catch up while you still remember what you spent.`, act: "add-expense", label: "Log now" });
    else if (!state.checkins[t] && new Date().getHours() >= hh)
      out.push({ lvl: "info", icon: "📝", text: "You haven't checked in today. Log what you spent, or tap “Nothing today”.", act: "add-expense", label: "Log now" });
    for (const g of state.goals) {
      const st = goalStatus(g);
      if (st.key === "behind")
        out.push({ lvl: "warn", icon: g.icon || "🎯", text: `${g.name} is ${st.label.toLowerCase()}. Add ${money(goalSuggestion(g))} this month to catch up.`, act: "contribute", arg: g.id, label: "Add money" });
    }
    for (const p of state.planned.filter((p) => p.type === "expense" && p.month > cur && monthDiff(cur, p.month) <= 4)) {
      const n = monthDiff(cur, p.month);
      out.push({ lvl: "info", icon: "📅", text: `Heads up: ${p.name} (${money(p.amount)}) is due in ${monthName(p.month, "month")}. Set aside about ${money(p.amount / n)} a month from now.` });
    }
    const f = forecast();
    const short = f.find((r) => r.balance < 0);
    if (short)
      out.push({ lvl: "bad", icon: "📉", text: `On your current plan you'll run short by ${money(-short.balance)} in ${monthName(short.mk)}. Let's fix that now, not then.`, act: "go", arg: "future", label: "See why" });
    if (!out.some((o) => o.lvl === "bad" || o.lvl === "warn") && hasPlan(mk))
      out.push({ lvl: "good", icon: "✅", text: `You're on track. You can spend ${money(s.perDay)} a day for the rest of ${monthName(mk, "month")}.` });
  }
  const order = { bad: 0, warn: 1, info: 2, good: 3 };
  return out.sort((a, b) => order[a.lvl] - order[b.lvl]);
}

/** A compact text picture of the user's finances, for the AI assistant. */
export function financialContext() {
  const cur = thisMonth();
  const s = summary(cur);
  const lines = [
    `Today: ${today()}. Currency: ${state.settings.currency}. Name: ${state.settings.name || "not given"}.`,
    `This month (${monthName(cur)}): income ${money(s.income)} (received ${money(s.received)}), budgeted ${money(s.budgeted)}, spent ${money(s.spent)}, saved ${money(s.saved)}, money left ${money(s.balance)}, unassigned ${money(s.unassigned)}, safe to spend per day ${money(s.perDay)} for ${s.daysLeft} days.`,
    "Categories this month (budget / spent): " + s.rows.map((r) => `${r.cat.name} ${money(r.budget)} / ${money(r.spent)}`).join("; "),
    "Goals: " + (state.goals.map((g) => `${g.name} ${money(goalSaved(g))} of ${money(g.target)}${g.deadline ? " by " + g.deadline : ""}`).join("; ") || "none"),
    "Recurring: " + (state.recurring.map((r) => `${r.name} ${r.type} ${money(r.amount)} per ${r.every}`).join("; ") || "none"),
    "Planned one-offs: " + (state.planned.map((p) => `${p.name} ${p.type} ${money(p.amount)} in ${p.month}`).join("; ") || "none"),
    "Forecast (month: free cash at end): " + forecast().map((r) => `${r.mk} ${money(r.balance)}`).join(", "),
    "Last 3 months spent: " + [1, 2, 3].map((n) => addMonths(cur, -n)).map((mk) => `${mk} ${money(summary(mk).spent)}`).join(", "),
    "Recent expenses: " + [...state.expenses].sort(byDateDesc).slice(0, 25).map((e) => `${e.date} ${cat(e.catId).name} ${money(e.amount)}${e.note ? " (" + e.note + ")" : ""}`).join("; ")
  ];
  return lines.join("\n");
}

// "Ask AI". With the cloud AI connected, questions go to your private
// Supabase function (Claude + web search), together with a summary of your
// numbers. Without it, a built-in assistant answers questions about your own
// budget right here on the device.

import { state, summary, insights, forecast, whatIf, goalSaved, goalSuggestion, goalStatus, activeCats, financialContext, expensesIn } from "./store.js";
import { aiEnabled, askCloudAI } from "./auth.js";
import { money, monthName, thisMonth, addMonths, parseAmount, sum } from "./util.js";

export const SUGGESTIONS = [
  "How much can I spend today?",
  "Where did my money go this month?",
  "Can I afford 150k in December?",
  "How are my savings goals doing?",
  "What does next month look like?",
  "How do I build an emergency fund?"
];

export async function ask(question) {
  if (aiEnabled) {
    const history = state.chat.slice(-12).map((m) => ({ role: m.role, content: m.text }));
    const res = await askCloudAI({ messages: history, context: financialContext() });
    return { text: res.reply, sources: res.sources || [] };
  }
  return { text: localAnswer(question), local: true };
}

/* --------------------------------------------- built-in assistant -- */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function findMonth(q) {
  const cur = thisMonth();
  if (/next month/.test(q)) return addMonths(cur, 1);
  if (/this month/.test(q)) return cur;
  const m = q.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  if (m) {
    const idx = MONTHS.indexOf(m[1]);
    for (let i = 0; i < 13; i++) {
      const mk = addMonths(cur, i);
      if (+mk.slice(5) === idx + 1) return mk;
    }
  }
  const inN = q.match(/in (\d+) months?/);
  if (inN) return addMonths(cur, +inN[1]);
  return null;
}
function findAmount(q) {
  const m = q.match(/(\d[\d,]*(?:\.\d+)?)\s*(k|m|thousand|million)?\b/);
  return m ? parseAmount(m[0]) : NaN;
}
const bullets = (arr) => arr.map((x) => "• " + x).join("\n");

export function localAnswer(question) {
  const q = question.toLowerCase();
  const cur = thisMonth();
  const s = summary(cur);

  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q) || /what can you|help me$|^help/.test(q))
    return `Hi${state.settings.name ? " " + state.settings.name : ""}! I'm your money partner. Ask me things like:\n${bullets(SUGGESTIONS.slice(0, 5))}`;

  if (/afford|buy|purchase|can i (get|pay)/.test(q)) {
    const amount = findAmount(q);
    if (!(amount > 0)) return "Tell me the amount and when, e.g. “Can I afford 150k in December?”";
    const mk = findMonth(q) || addMonths(cur, 1);
    if (mk === cur) {
      return s.budgetLeft >= amount
        ? `Yes. You have ${money(s.budgetLeft)} of budget left this month, but spending ${money(amount)} leaves only ${money(s.budgetLeft - amount)} for the remaining ${s.daysLeft} days. Move it from a category first so your plan stays honest.`
        : `Not from this month's budget: you have ${money(s.budgetLeft)} left. Plan it for a later month instead. Ask me “Can I afford ${money(amount)} next month?”`;
    }
    const r = whatIf("this purchase", amount, mk);
    if (r.ok)
      return `Yes, it fits. If you spend ${money(amount)} in ${monthName(mk)}, your lowest point is ${money(r.low.balance)} in ${monthName(r.low.mk)}. To be safe, put aside ${money(r.perMonth)} a month from now until then. You can add it on the Future screen so I keep it in the plan.`;
    return `Not yet. It would leave you ${money(-r.firstShort.balance)} short in ${monthName(r.firstShort.mk)}.${r.earliest ? ` At your current pace, the earliest it fits is ${monthName(r.earliest)}.` : " Cut a recurring cost or raise your income first."} Saving ${money(r.perMonth)} a month from now would get you there by ${monthName(mk)}.`;
  }

  if (/today|per day|a day|daily|left|remaining|how much (can|do) i (spend|have)/.test(q))
    return `This month you have ${money(s.balance)} left from your income, and ${money(s.budgetLeft)} left in your budget. That's about ${money(s.perDay)} a day for the next ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"}.`;

  const catHit = activeCats().find((c) => c.name.toLowerCase().split(/[^a-z]+/).some((w) => w.length > 3 && q.includes(w)));
  if (catHit && /spen|budget|how much|cost/.test(q)) {
    const mk = findMonth(q) || cur;
    const ss = mk === cur ? s : summary(mk);
    const spent = ss.spentBy[catHit.id] || 0;
    const budget = ss.m.budgets[catHit.id] || 0;
    const n = expensesIn(mk).filter((e) => e.catId === catHit.id).length;
    return `${catHit.icon} ${catHit.name} in ${monthName(mk)}: ${money(spent)} spent across ${n} expense${n === 1 ? "" : "s"}${budget ? `, from a budget of ${money(budget)} (${money(budget - spent)} left)` : ", with no budget set"}.`;
  }

  if (/where|breakdown|biggest|most|spent|spending/.test(q)) {
    const mk = findMonth(q) || cur;
    const ss = mk === cur ? s : summary(mk);
    if (!ss.spent) return `No spending logged for ${monthName(mk)} yet.`;
    const top = [...ss.rows].sort((a, b) => b.spent - a.spent).filter((r) => r.spent > 0).slice(0, 5);
    return `In ${monthName(mk)} you've spent ${money(ss.spent)}. The biggest areas:\n${bullets(top.map((r) => `${r.cat.icon} ${r.cat.name}: ${money(r.spent)} (${Math.round((r.spent / ss.spent) * 100)}%)`))}`;
  }

  if (/goal|saving|save/.test(q) && !/emergency|how do i|how to/.test(q)) {
    if (!state.goals.length) return "You don't have any savings goals yet. Start with an emergency fund of 3–6 months of expenses. Add one on the Goals screen.";
    return bullets(state.goals.map((g) => `${g.icon || "🎯"} ${g.name}: ${money(goalSaved(g))} of ${money(g.target)}. ${goalStatus(g).label}${goalSuggestion(g) ? `. Put in ${money(goalSuggestion(g))} this month` : ""}.`));
  }

  if (/next month|future|forecast|plan ahead|coming months|year/.test(q)) {
    const f = forecast();
    const short = f.find((r) => r.balance < 0);
    const n = f[0];
    return `Next month (${monthName(n.mk)}): expected income ${money(n.income)}, bills ${money(n.bills)}, everyday spending ~${money(n.everyday)}, savings ${money(n.savings)}. Net ${money(n.net, { sign: true })}.\n${short ? `⚠ You'd run short by ${money(-short.balance)} in ${monthName(short.mk)}.` : `✅ Your free cash stays positive for the next 12 months, ending at about ${money(f[f.length - 1].balance)}.`}`;
  }

  if (/income|salary|earn/.test(q))
    return `${monthName(cur)} income: ${money(s.income)} expected, ${money(s.received)} received. Recurring income: ${money(sum(state.recurring.filter((r) => r.type === "income"), (r) => r.amount))} a month.`;

  if (/emergency/.test(q))
    return `An emergency fund covers 3–6 months of essential costs. Your needs budget this month is ${money(sum(s.rows.filter((r) => r.cat.kind === "need"), (r) => r.budget))}, so aim for ${money(3 * sum(s.rows.filter((r) => r.cat.kind === "need"), (r) => r.budget))} to ${money(6 * sum(s.rows.filter((r) => r.cat.kind === "need"), (r) => r.budget))}. Keep it in a separate account you don't touch, and fund it first each month.`;

  if (/tip|advice|improve|better|how (do|can) i save/.test(q)) {
    const ins = insights(cur).filter((i) => i.lvl !== "good").slice(0, 3).map((i) => i.text);
    return `Here's what I'd focus on:\n${bullets(ins.length ? ins : ["Log every expense the same day.", "Pay yourself first: move savings on payday.", "Review your wants categories every Sunday."])}`;
  }

  return "I can answer questions about your own budget right now: what's left, where your money went, a category's spending, your goals, the coming months, and whether you can afford something. General money questions with internet research will work once the AI connection is switched on (Settings → AI assistant).";
}

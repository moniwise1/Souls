// Excel, CSV and backup files, and sending them by email.

import { state, summary, cat, goal, goalSaved, forecast, byDateDesc, migrate } from "./store.js";
import { download, loadScript, today, monthName, round2 } from "./util.js";

const XLSX_SRC = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
async function xlsxLib() {
  if (!window.XLSX) await loadScript(XLSX_SRC);
  return window.XLSX;
}

function sheets() {
  const months = Object.keys(state.months).sort();
  const tx = [
    ...state.expenses.map((e) => ({ Date: e.date, Type: "Expense", Category: cat(e.catId).name, Description: e.note || "", Amount: -e.amount, "Paid with": e.method || "" })),
    ...months.flatMap((mk) => state.months[mk].incomes.map((i) => ({ Date: i.date, Type: i.received ? "Income" : "Income (expected)", Category: "Income", Description: i.source, Amount: i.amount, "Paid with": "" }))),
    ...state.contributions.map((c) => ({ Date: c.date, Type: c.amount >= 0 ? "Saved" : "Withdrawn from savings", Category: goal(c.goalId)?.name || "Savings", Description: c.note || "", Amount: -c.amount, "Paid with": "" }))
  ].sort((a, b) => b.Date.localeCompare(a.Date));
  const monthly = months.map((mk) => {
    const s = summary(mk);
    return { Month: monthName(mk), Income: s.income, Budgeted: s.budgeted, "Savings planned": s.savingsPlan, Spent: s.spent, Saved: s.saved, "Money left": s.balance, Unassigned: s.unassigned };
  });
  const plan = months.flatMap((mk) => summary(mk).rows.map((r) => ({ Month: monthName(mk), Category: r.cat.name, Type: r.cat.kind === "need" ? "Need" : "Want", Budget: r.budget, Spent: r.spent, Left: r.left })));
  const goals = state.goals.map((g) => ({ Goal: g.name, Target: g.target, Saved: goalSaved(g), Remaining: round2(Math.max(0, g.target - goalSaved(g))), Deadline: g.deadline || "", "Monthly plan": g.monthly || "" }));
  const fc = forecast().map((r) => ({ Month: monthName(r.mk), Income: r.income, "Recurring bills": r.bills, "One-off costs": r.oneoff, "Everyday spending": r.everyday, Savings: r.savings, Net: r.net, "Free cash at month end": r.balance, "Savings pot": r.pot }));
  return [["Transactions", tx], ["Monthly summary", monthly], ["Budget plan", plan], ["Savings goals", goals], ["12-month forecast", fc]];
}

export async function excelBlob() {
  const X = await xlsxLib();
  const wb = X.utils.book_new();
  for (const [name, rows] of sheets()) {
    const ws = X.utils.json_to_sheet(rows.length ? rows : [{ Note: "Nothing here yet" }]);
    const cols = Object.keys(rows[0] || { Note: "" });
    ws["!cols"] = cols.map((c) => ({ wch: Math.max(12, c.length + 2, ...rows.slice(0, 200).map((r) => String(r[c] ?? "").length + 1)) }));
    X.utils.book_append_sheet(wb, ws, name);
  }
  const out = X.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
export const excelName = () => `budget-${today()}.xlsx`;
export async function exportExcel() {
  download(excelName(), await excelBlob());
}

export function exportCSV() {
  const rows = [...state.expenses].sort(byDateDesc);
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = ["Date,Category,Description,Amount,Paid with", ...rows.map((e) => [e.date, cat(e.catId).name, e.note, e.amount, e.method].map(q).join(","))].join("\r\n");
  download(`expenses-${today()}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
}

export function exportBackup() {
  download(`budget-backup-${today()}.json`, JSON.stringify({ app: "budget-partner", exported: new Date().toISOString(), data: state }, null, 1), "application/json");
}
export async function readBackup(file) {
  const json = JSON.parse(await file.text());
  const data = json && json.app === "budget-partner" ? json.data : json;
  if (!data || !data.settings || !Array.isArray(data.categories)) throw new Error("That file isn't a Budget Partner backup.");
  return migrate(data);
}

/** Share the Excel file (phone share sheet → Gmail etc.), or download it and open an email draft. */
export async function emailReport(to, summaryText) {
  const blob = await excelBlob();
  const file = new File([blob], excelName(), { type: blob.type });
  const subject = `My budget report – ${today()}`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: subject, text: summaryText });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancelled";
    }
  }
  download(file.name, blob);
  const body = `${summaryText}\n\n(The Excel file "${file.name}" has just been downloaded. Attach it to this email.)`;
  location.href = `mailto:${encodeURIComponent(to || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return "mailto";
}

// Hand-drawn SVG charts (no library, works offline). Colours come from CSS
// variables so light and dark themes each use their own validated steps.
// Every mark carries data-tip for the hover/tap tooltip, and every chart has
// a table view underneath.

import { esc, money, monthName, niceMax } from "./util.js";

let W = 640;
const fit = () => { W = typeof innerWidth !== "undefined" && innerWidth < 600 ? 360 : 640; };
const H = 230;
const PAD = { l: 56, r: 8, t: 12, b: 28 };

/** Bar path with 4px rounded ends away from the baseline. */
function bar(x, y0, y1, w) {
  const top = Math.min(y0, y1);
  const h = Math.abs(y1 - y0);
  if (h < 0.5) return "";
  const r = Math.min(4, h, w / 2);
  if (y1 <= y0) // grows upward from y0
    return `M${x},${y0}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${y0}Z`;
  return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
}
function axis(min, max, plotH, fmt) {
  const ticks = 4;
  let g = "";
  for (let i = 0; i <= ticks; i++) {
    const v = min + ((max - min) * i) / ticks;
    const y = PAD.t + plotH - ((v - min) / (max - min)) * plotH;
    g += `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y}" y2="${y}" class="${Math.abs(v) < 1e-9 ? "c-base" : "c-grid"}"/>`;
    g += `<text x="${PAD.l - 8}" y="${y + 4}" class="c-tick" text-anchor="end">${esc(fmt(v))}</text>`;
  }
  return g;
}

/** Income vs spent vs saved for several months (grouped bars, 3 series). */
export function trendChart(rows) {
  fit();
  const series = [["income", "Income", "s1"], ["spent", "Spent", "s2"], ["saved", "Saved", "s3"]];
  if (rows.every((d) => !d.income && !d.spent && !d.saved))
    return `<p class="empty">Your monthly history builds up here as you use the app.</p>`;
  const max = niceMax(Math.max(...rows.flatMap((d) => series.map(([k]) => d[k]))));
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const gw = plotW / rows.length;
  const bw = Math.max(4, Math.min(18, (gw - 8) / 3));
  const y = (v) => PAD.t + plotH - (Math.max(0, v) / max) * plotH;
  let marks = "";
  rows.forEach((d, i) => {
    const gx = PAD.l + i * gw + (gw - (3 * bw + 4)) / 2;
    series.forEach(([k, , cls], j) => {
      marks += `<path d="${bar(gx + j * (bw + 2), y(0), y(d[k]), bw)}" class="c-${cls}"/>`;
    });
    const tip = `<strong>${esc(monthName(d.mk))}</strong><br>` + series.map(([k, label, cls]) => `<span class="sw c-${cls}"></span>${label}: ${esc(money(d[k]))}`).join("<br>");
    marks += `<rect x="${PAD.l + i * gw}" y="${PAD.t}" width="${gw}" height="${plotH}" class="c-hit" data-tip="${esc(tip)}" tabindex="0" aria-label="${esc(monthName(d.mk))}"/>`;
    marks += `<text x="${PAD.l + i * gw + gw / 2}" y="${H - 8}" class="c-tick" text-anchor="middle">${esc(monthName(d.mk, "short"))}</text>`;
  });
  const legend = series.map(([, label, cls]) => `<span class="lg"><span class="sw c-${cls}"></span>${label}</span>`).join("");
  const table = `<table class="tbl"><thead><tr><th>Month</th><th>Income</th><th>Spent</th><th>Saved</th></tr></thead><tbody>${rows
    .map((d) => `<tr><td>${esc(monthName(d.mk))}</td><td>${money(d.income)}</td><td>${money(d.spent)}</td><td>${money(d.saved)}</td></tr>`).join("")}</tbody></table>`;
  return `<div class="chart"><div class="legend">${legend}</div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Income, spending and savings by month">${axis(0, max, plotH, (v) => money(v, { compact: true }))}${marks}</svg>
    <details class="tbl-wrap"><summary>View as table</summary>${table}</details></div>`;
}

/** Projected free cash at the end of each month (single series; shortfalls marked). */
export function balanceChart(rows) {
  if (!rows.length) return "";
  fit();
  const lo = Math.min(0, ...rows.map((r) => r.balance));
  const hi = Math.max(0, ...rows.map((r) => r.balance));
  const min = lo < 0 ? -niceMax(-lo) : 0;
  const top = hi > 0 ? niceMax(hi) : min < 0 ? 0 : 1;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const y = (v) => PAD.t + plotH - ((v - min) / (top - min || 1)) * plotH;
  const gw = plotW / rows.length;
  const bw = Math.max(6, Math.min(28, gw - 6));
  let marks = "";
  rows.forEach((r, i) => {
    const x = PAD.l + i * gw + (gw - bw) / 2;
    const neg = r.balance < 0;
    marks += `<path d="${bar(x, y(0), y(r.balance), bw)}" class="${neg ? "c-bad" : "c-s1"}"/>`;
    if (neg) marks += `<text x="${x + bw / 2}" y="${y(r.balance) + 14}" class="c-tick c-badtxt" text-anchor="middle">▼</text>`;
    const tip = `<strong>${esc(monthName(r.mk))}</strong><br>Free cash at month end: ${esc(money(r.balance))}${neg ? " ⚠ short" : ""}<br>Month net: ${esc(money(r.net, { sign: true }))}`;
    marks += `<rect x="${PAD.l + i * gw}" y="${PAD.t}" width="${gw}" height="${plotH}" class="c-hit" data-tip="${esc(tip)}" tabindex="0" aria-label="${esc(monthName(r.mk))}"/>`;
    if (gw >= 30 || i % 2 === 0) marks += `<text x="${PAD.l + i * gw + gw / 2}" y="${H - 8}" class="c-tick" text-anchor="middle">${esc(monthName(r.mk, "short"))}</text>`;
  });
  const zero = `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(0)}" y2="${y(0)}" class="c-base"/>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Projected free cash by month">${axis(min, top, plotH, (v) => money(v, { compact: true }))}${zero}${marks}</svg></div>`;
}

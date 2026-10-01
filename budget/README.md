# Budget Partner

A personal budget app that works like a banking app. It is plain HTML, CSS and JavaScript, with no build step, and it works offline. Open `budget/index.html` from any web host (GitHub Pages works). It needs `https://` or `localhost` so it can encrypt your data.

## What it does

| Area | What you get |
|---|---|
| **Account** | Sign up, sign in, and "Keep me signed in". Your password protects and encrypts your data. You can change your password or delete your account. |
| **Dashboard** | A green balance card showing your money left this month. It starts at your income and goes down with every expense or saving. It also shows "safe to spend today", budget left, unassigned money, quick actions, your daily check-in and streak, your money partner's alerts, category progress and a 6-month chart. You can hide the balance with the eye button. |
| **Transactions** | Every expense, income and saving in one list, grouped by day. You can search, filter, edit and undo a delete. |
| **Budget plan** | Income, category budgets (needs and wants) and savings. A live "left to assign" bar keeps the plan balanced, so every unit of income has a job. **Strict mode** won't let an overspend pass: you cover it from another category, taking from wants before needs. You can also move money between categories, copy last month's budgets, or build next month's plan automatically. |
| **Savings goals** | Targets, deadlines, the monthly amount you need, on-track or behind status, deposits and withdrawals. It suggests an emergency fund too. |
| **Future planner** | A 12-month forecast built from recurring income and bills, planned one-off costs and income, everyday spending and your savings goals. It warns you about a shortfall months ahead. **Can I afford it?** tests a purchase, tells you the earliest month it fits and how much to save each month, then adds it to your plan or turns it into a goal. |
| **Ask AI** | A private chat. Right now it answers from your own numbers on your device. Once the AI is connected (below), it uses Claude with web search. |
| **Reports & export** | A monthly report, an **Excel workbook** (transactions, monthly summary, plan, goals, forecast), a CSV file, a full backup and restore, and **Email my data** (the phone share sheet, or a download plus an email draft). |
| **Reminders** | A daily check-in notification at your chosen time, plus a daily **Google Calendar** event or **.ics** file. The calendar option works on every phone, even when the app is closed. |

The app is mobile-first, has a menu drawer and a bottom tab bar, supports dark mode and can be installed as an app.

## Your data and privacy

- **Device accounts (default).** Your password is turned into an encryption key with PBKDF2-SHA256 (210,000 rounds). Your budget is stored in this browser encrypted with AES-256-GCM, and nothing leaves the device. **A forgotten password can't be recovered**, so export a backup now and then (Reports & export → Full backup).
- **Cloud accounts (optional).** You sign in on any device and your data syncs. Each user's data sits in one row that only that user can read. The copy on each device stays encrypted.

## Switch on cloud accounts (sync across devices)

1. Create a **new** free project at [supabase.com](https://supabase.com). Don't reuse the store's project, because that one only lets invited staff sign up.
2. Open **SQL Editor** in that project, paste the contents of `budget/supabase/schema.sql`, and click **Run**.
3. Go to **Authentication → URL Configuration**. Set **Site URL** to your app address, for example `https://<you>.github.io/Souls/budget/`.
4. Go to **Project Settings → API**. Copy the **Project URL** and the **publishable (anon) key** into `budget/config.js`.
5. Optional: once you have signed up, turn off **Authentication → Sign In / Providers → Allow new users to sign up**. Then nobody else can create an account in your project.

Device accounts that already exist move to the cloud automatically the first time you sign in with the same email and password.

## Switch on the AI assistant (Claude and web search)

You need cloud accounts first (above). Then:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli). Then run these from the `budget/` folder (if the CLI asks, run `supabase init` first and keep the existing `supabase/` folder):
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy budget-ai
   ```
3. Set `aiEnabled: true` in `budget/config.js`.

The function only answers a signed-in user and stores nothing. Each question is sent with a short summary of your budget so the answer fits your situation. Usage is billed to your Anthropic account, at about a few cents per question.

## Files

| File | What it is |
|---|---|
| `index.html`, `app.css` | The page and its styling (green and white, light and dark) |
| `config.js` | Cloud and AI switches |
| `js/app.js` | Screens, dialogs and actions |
| `js/store.js` | Data model, budgets, insights, goals and forecast maths |
| `js/auth.js` | Accounts, encryption, cloud sync |
| `js/export.js` | Excel, CSV, backup and email |
| `js/ai.js` | Ask AI (built-in answers, and the cloud AI) |
| `js/reminders.js` | Notifications and calendar reminders |
| `js/charts.js` | SVG charts |
| `sw.js`, `manifest.webmanifest` | Offline support, installable app, background reminders |
| `supabase/` | Database setup and the AI function |

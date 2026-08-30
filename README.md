# Family Expense Tracker 💰

A beautiful, offline-first **Progressive Web App** for family budgeting and expense
tracking. Works on Android, iOS, tablets, and desktop — installable, fast, and
fully customizable.

**🔗 Live demo:** https://expanse-tracker-olive.vercel.app/

## Features

- 📊 **Dashboard** — greeting hero, wallet balance, budget ring, summary cards,
  spending trend & breakdown charts, quick actions, recent transactions.
- 💸 **Expenses & Income** — rich entry form (category, member, account, tags,
  merchant, receipt image, notes), search & filters.
- 🔁 **Transfers** between wallets/accounts.
- 🏦 **Wallets/Accounts** — cash, bank, credit, UPI, wallet, investment with live
  balances.
- 🎯 **Budgets** — monthly limits per category with progress bars & overspend alerts.
- 🐷 **Savings Goals** — animated progress rings, contributions, completion badges.
- 🧾 **Bills & EMI** — recurring payments, due dates, overdue flags, auto-repeat.
- 👨‍👩‍👧 **Family Members** — roles, avatars, colors, per-member spending.
- 📈 **Reports** — income vs expense, savings trend, category & member breakdowns.
- 📅 **Calendar** — monthly view with per-day transaction markers.
- 🏷️ **Categories** — customizable emoji + color, income/expense.
- 🛒 **Shopping Lists** — shared checklists, estimated cost, convert item → expense.
- 📝 **Notes** — colorful, pinnable finance notes.
- ⚙️ **Settings** — live theming (palettes, custom colors, fonts, radius, shadows,
  glassmorphism, spacing, animation), currency, date format, privacy (PIN lock,
  hide balances), accessibility (large text, high contrast, reduce motion),
  and JSON/CSV backup + import.
- 🌗 Light / Dark / System themes, applied instantly.
- 📴 Offline-first via IndexedDB (Dexie) + Service Worker (Workbox).

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Recharts ·
Dexie (IndexedDB) · Zustand · React Hook Form · React Router · Lucide Icons ·
vite-plugin-pwa (Workbox).

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build (+ PWA service worker)
npm run preview  # preview the production build
```

Then open http://localhost:5173. Install it from your browser's "Install app"
option to use it like a native app.

## Data & Privacy

All data is stored locally on your device in IndexedDB — no backend, no account.
Use **Settings → Backup** to export/import JSON or export CSV. The architecture is
ready for future cloud sync.

## Project Structure

```
src/
  components/   ui, layout, transactions, settings, PinLock
  db/           Dexie schema, types, seed data
  lib/          hooks, formatters, stats, backup, utils
  pages/        one file per screen
  store/        Zustand stores (settings + UI)
```

## Regenerating icons

```bash
node scripts/gen-icons.mjs
```

# Expense Vibe

Expense Vibe is a mobile‑first personal finance tracker built with React + Vite on the frontend and Convex on the backend. It supports expenses and incomes, recurring transactions, credit‑card installment schedules, category and payment type management, and financial projections.

## Features
- Add, edit, verify, and soft‑delete transactions (expenses and income)
- Recurring transactions with daily/weekly/monthly/semestral/yearly frequencies
- Credit card schedules (installments) with closing and due day logic
- Category and payment type management per user
- Projections view combining recurring items and installment schedules
- Mobile‑first UI with drawers and bottom navigation

## Tech Stack
- Frontend: React 18, Vite, TailwindCSS, Radix UI, shadcn/ui patterns, Recharts/Chart.js
- Backend: Convex (TypeScript), Convex cron/actions, internal mutations for schedules
- Auth: Auth0 via `@auth0/auth0-react` and `convex/react-auth0`
- Testing: Playwright (E2E)

## Project Structure
- `src/` — React app (pages, components, context, hooks, lib)
- `convex/` — Convex backend (schema, functions, internal helpers, migrations, cron)
- `planning/` — Docs: analysis, phased plan, and summary
- `tests/` — Playwright E2E tests

## Getting Started
1) Install dependencies
```bash
npm i
```

2) Configure environment
Create `.env.local` with:
```
CONVEX_DEPLOY_KEY=
CONVEX_DEPLOYMENT=
VITE_CONVEX_URL=
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=
RESEND_API_KEY=
VITE_APP_URL=
```

3) Run in development (frontend + backend)
```bash
npm run dev
```

4) Build
```bash
npm run build
```

5) Lint/typecheck
```bash
npm run lint
```

## Authentication
The app uses Auth0 on the client via `@auth0/auth0-react` and integrates with Convex using `ConvexProviderWithAuth0`. User records are created/linked on first sign‑in and seeded with default categories and payment types.

## Backend Notes
- All schedule generation is consolidated in `convex/internal/expenses.ts:generatePaymentSchedules` and invoked from expense/recurring flows.
- Daily cron (`convex/crons.ts`) processes due recurring transactions.

## HTTP API
No user‑defined HTTP routes are currently exposed. `convex/http.ts` is present for future use.

## Testing
Playwright E2E tests:
```bash
npm run test:e2e
```
Ensure the dev server is running beforehand.

## Migrations
Prefer invoking Convex mutations with the CLI. Example:
```bash
npx convex run expenses:migratePaymentSchedules
```

## Contributing
See `planning/analysis.md` for the current phased plan and `planning/summary.md` for a high‑level system overview.

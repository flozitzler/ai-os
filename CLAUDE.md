# lifesystem — the system that runs itself

AI-native personal operating system. The first life tracker designed to be managed by an AI agent.

## What Makes It Different
- **Daily Briefing**: computed morning brief that tells you what matters, not just shows charts
- **Insights Engine**: 13 types of cross-domain pattern detection (sleep→mood, habit→performance, day-of-week patterns)
- **AI-first architecture**: JSON file storage so Claude Code can read/write all data directly
- The dashboard is the visualization layer. The AI agent is the brain.

## Tech Stack
- Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui
- Recharts for charts, date-fns for dates, lucide-react for icons
- Local JSON file storage in data/

## Data
- `data/daily/YYYY-MM-DD.json` — daily check-ins
- `data/habits.json` — habit definitions + completion map
- `data/goals.json` — quarterly OKRs
- `data/finance.json` — transactions
- `data/profile.json` — user settings + life area scores
- You can read/write these files directly

## Key Pages
- `/briefing` — personalized morning brief (THE primary experience)
- `/` — dashboard overview
- `/checkin` — daily check-in form
- `/habits` — habit tracker with streaks
- `/goals` — OKR tracker
- `/insights` — computed pattern recognition
- `/pulse` — trend charts
- `/finance` — income/expense tracker
- `/settings` — profile, habits, life areas
- `/setup` — first-time onboarding

## Conventions
- `@/` import alias maps to `src/`
- Server Components by default, `"use client"` only when needed
- All API routes use `Response.json()`
- Dates are `YYYY-MM-DD` strings everywhere
- Dark theme only (no light mode)
- Route group `(dashboard)` wraps all pages with sidebar/nav
- `/setup` renders without sidebar (full-screen onboarding)

# ⚡ SprintForge — Agile Sprint & Retrospective Tool with Fintech Compliance Tracking

A single-page web app that runs the full Scrum loop — backlog grooming → sprint planning → live board → burndown/velocity analytics → AI-assisted retrospective — with a fintech twist: **compliance-flagged stories and an immutable audit trail** so regulated teams can ship product work and audit evidence from the same board.

Built with **React 18 + Vite + Tailwind CSS + Recharts**. Frontend-only: demo data is seeded on first load and persisted to `localStorage`, so the app is fully interactive with zero backend.

## Features

### 1. Backlog Grooming
- Story CRUD with **Fibonacci story points**, epics, assignees, and business value / effort scoring (1–5)
- Backlog auto-ranked by **value density (value ÷ effort)** — a WSJF-lite prioritization heuristic
- **2×2 Prioritization Matrix** view: Quick Wins / Big Bets / Fill-ins / Money Pits
- One-click commit of a story into the active sprint

### 2. Sprint Board (Kanban)
- Drag-and-drop columns: To Do → In Progress → Review → Done
- Every move updates the burndown **in real time** and writes to the audit trail
- Double-click any card to edit scope, points, or compliance flags

### 3. Burndown, Velocity & Forecasting
- Live **burndown chart** (ideal vs actual) for the active sprint
- **Velocity chart**: committed vs completed across past sprints, with a 3-sprint rolling average
- **Forecast**: projects how many sprints the groomed backlog needs at current rolling velocity

### 4. AI Retrospective Generator
Paste raw retro notes and get structured insights:
- **Sentiment scoring** per observation (went well vs needs improvement)
- **Theme clustering** across 9 agile failure modes (scope creep, dependencies, testing, estimation, …)
- **Recurrence detection** — themes that appeared in past retros are flagged `↻ recurring` and escalated to P0
- **Action items** with suggested owner, priority, and rationale

The engine is a deterministic NLP pipeline (`src/lib/retroEngine.js`) behind a single `generateInsights()` interface — `claudePromptFor()` builds a ready-to-use prompt so it can be swapped for the Claude API via a serverless function without touching the UI.

### 5. Compliance Sprint Tracker (fintech)
- Stories taggable with **SOX, KYC/AML, PCI-DSS, GDPR** + a control reference (e.g. "PCI Req 3.4")
- **Append-only audit trail**: every create/edit/status-change/descope is recorded with user + timestamp
- **Audit-readiness %** per sprint and **CSV export** of the trail — the evidence format auditors actually ask for

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to /dist
```

## Deploy to Cloudflare

SprintForge is a frontend-only Vite SPA, so **Cloudflare Pages is the recommended and lowest-complexity option**. No Worker backend or environment variables are required. The repository also includes a Workers Static Assets configuration if you prefer Workers.

### Cloudflare Pages (recommended)

Connect this GitHub repository in **Workers & Pages → Create → Pages → Import an existing Git repository**, then configure:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `20` or newer

The committed `public/_redirects` file provides SPA fallback routing and `public/_headers` adds immutable asset caching and basic browser security headers.

You can also deploy Pages from your terminal:

```bash
npm run deploy:pages
```

### Cloudflare Workers Static Assets

The committed `wrangler.jsonc` serves `dist` as static assets and uses `single-page-application` fallback handling:

```bash
npx wrangler login
npm run deploy:workers
```

Use Pages for the current frontend-only version. Move to Workers later only if you add server-side APIs, authentication middleware, or other edge logic.

## Architecture

```
src/
├── App.jsx                  # shell + sidebar navigation
├── store.jsx                # React context + reducer, localStorage persistence,
│                            #   audit-log middleware (every mutation is logged)
├── data/seed.js             # demo dataset: fintech payments team, 6 sprints
├── lib/
│   ├── forecast.js          # pure functions: burndown, velocity, forecasting
│   └── retroEngine.js       # retro NLP pipeline + Claude API upgrade path
└── components/              # one component per page + shared UI primitives
```

Design decisions worth noting:

- **State as a single reducer with audit middleware.** Mutations flow through one reducer; audit entries are appended there, not in components — so the trail can't be bypassed. This mirrors how event-sourced fintech systems guarantee evidence integrity.
- **Pure analytics functions.** Burndown/velocity/forecast math lives in `lib/forecast.js` with no React imports — testable and explainable.
- **Relative seed dates.** Demo data is generated relative to "today", so the burndown always looks mid-sprint live, not stale.

## Why this project (PM context)

This was built to demonstrate product thinking, not just code:

- **Scrum mechanics modeled correctly** — committed vs completed velocity, descope events, mid-sprint scope tracked as audit entries.
- **Prioritization is opinionated** — value density ranking + a 2×2 matrix that forces explicit trade-off conversations.
- **Retros that compound** — recurrence detection turns retrospectives from a ritual into a memory: a theme raised twice escalates automatically.
- **Compliance as a first-class workflow** — in fintech, audit evidence is usually a quarterly scramble. Tying it to the board makes evidence a by-product of normal delivery.

## License

MIT

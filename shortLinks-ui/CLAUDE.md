# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check (tsc -b) then Vite production build
npm run lint       # ESLint on all .ts/.tsx files
npm run preview    # Preview production build locally
```

No test framework is configured.

## Architecture

**Single-view dashboard** for a short-link management service (short-link analytics, similar to Bitly admin). All UI labels are in Chinese. Currently a static prototype — no API calls, no routing, all data hardcoded/zeroed.

**Component tree:**

```
App.tsx              — layout shell; holds activeTab state ('normal' | 'api')
├── Sidebar.tsx      — 240px left nav (logo, project selector, nav items)
├── Header.tsx       — top bar: tab switcher + search; receives activeTab/onTabChange from App
└── Dashboard.tsx    — main content compositor
    ├── StatsCards.tsx         — welcome card + KPI cards (visits, unique visitors, IPs)
    ├── AccessTrendChart.tsx   — Recharts line chart (7d/30d toggle); uses local state for period
    └── InsightPanels.tsx      — Top5Panel (empty-state SVG) + DataInsightsPanel (region/time/browser/OS)
```

**Key constraints from `tsconfig.app.json`:**
- `erasableSyntaxOnly: true` — do not use `enum`, `namespace`, or decorators
- `noUnusedLocals` / `noUnusedParameters` — unused vars are compile errors
- `noEmit: true` — TypeScript only type-checks; Vite handles transpilation

**Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`. Import Tailwind with `@import "tailwindcss"` in CSS files.

**Icons:** `lucide-react` (v1+).  
**Charts:** `recharts` (v3+).  
**No routing, no state management library, no HTTP client installed.**

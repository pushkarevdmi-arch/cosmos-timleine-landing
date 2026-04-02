## Description
Cosmorrow is a Next.js site that presents “Upcoming Events” as a grid or timeline view. Event content is sourced from a local JSON dataset (`data/events.json`) and rendered by the client-side home page (`app/page.tsx`).

## Tech Stack
- Next.js (`package.json`)
- React (`package.json`)
- TypeScript (`package.json`)
- Tailwind CSS v4 (`package.json`)

## Architecture
- Frontend location: `app/` (App Router; main page in `app/page.tsx`)
- Backend: Not detected in the repo (no `app/api/` or `pages/api/`)
- Data handling: Local file `data/events.json` imported into `app/page.tsx`

## Project Structure
- `app/`: App Router entry (`layout.tsx`, `page.tsx`) and global/generated styles (`globals.css`, `design-tokens.css`, `ds-tailwind-theme.css`)
- `components/`: UI components for events/views (e.g. `HeroEvent`, `EventGrid`, `EventTimeline`, `EventDetailsModal`)
- `data/`: Local content (`events.json`)
- `design-system/`: Design-token source of truth (`tokens.json`) and structure docs
- `scripts/`: Token build script (`build-design-tokens.mjs`)
- `public/`: Static assets (icons, logo, fonts, etc.)

## Getting Started
1. Install:
   ```sh
   npm install
   ```
2. Dev:
   ```sh
   npm run dev
   ```
3. Build:
   ```sh
   npm run build
   ```

## Deployment
- Deployment is not explicitly documented in the repo.

## Summary
- Next.js App Router frontend in `app/`, with the main UI in `app/page.tsx`
- Events come from `data/events.json` (no API routes detected)
- Views are composed from `components/` (grid/timeline + modal)
- Design tokens live in `design-system/tokens.json` and are generated via `npm run build:tokens`

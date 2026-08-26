# Content OS

Your personal AI content operating system for running a 5-channel YouTube operation:
**The World Explained · AI Blueprint · Unfiltered & Uncut · Money with Mo · Hindi Lofi Songs**.

Opens to one answer: **what should I work on today.**

## Run it locally

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. The app works immediately with realistic sample data for all
five channels — no account, no API key, no backend.

## Build

```bash
npm run build   # type-checks, then builds to dist/
npm run preview # serve the production build locally
```

## Deploy to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and deploys `dist/` automatically on every
push to `main`. One-time setup:

1. Push this repo to GitHub (or push to `main` if it's already there).
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab). The app will be live
   at `https://<your-username>.github.io/<repo-name>/`.

No build secrets are required — AI features run in demo mode by default and only call a real
provider if you add your own API key in **Settings** (stored in your browser only, never sent
anywhere but directly to that provider).

## How it's organized

```
src/
  types.ts              Core domain types (Video, Idea, Channel, Stage, Settings…)
  data/                 Channel definitions + realistic seed content
  store/                Zustand store, persisted to localStorage
  lib/                  Small pure helpers (dates, pipeline stages, utils)
  services/             AI service layer — one file per capability:
                         researchService, scriptService, packagingService,
                         ideaService, analyticsService, strategyService, planService
    services/ai/        provider.ts (OpenAI/Anthropic fetch calls), mockGen.ts
                         (channel-aware demo generation), flavor.ts (per-channel voice)
  components/           Shared UI (layout, badges, modal, empty states)
  pages/                One file per screen (Dashboard, Pipeline, Video workspace, …)
```

Every AI feature is a plain async function with a typed return shape. With no API key
configured (or provider set to "Demo"), it returns deterministic, channel-aware mock content
instantly — so the app is fully usable on day one. Add an OpenAI or Anthropic key in Settings to
switch to live generation; failures fall back to demo output automatically.

Data (videos, ideas, settings) lives in `localStorage` under the `content-os-store` key. Use
**Settings → Export/Import** to back it up or move it between browsers.

## What's next (V2 ideas)

- Real backend + sync (multi-device, no more localStorage-only)
- YouTube Data API integration to pull real analytics instead of manual entry
- Script/thumbnail versioning and A/B test tracking over time
- Team/collaborator roles (editor, thumbnail designer) with task handoff
- Richer light theme pass on channel accent colors
- Push/email reminders for today's plan

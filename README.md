# Content OS

Your personal AI content operating system for running a 5-channel YouTube operation:
**The World Explained · AI Blueprint · Unfiltered & Uncut · Money with Mo · Hindi Lofi Songs**.

Opens to one answer: **what should I work on today.**

## Run it locally

```bash
cd app
npm install
npm run dev
```

Open the printed `localhost` URL. The app works immediately with realistic sample data for all
five channels — no account, no API key, no backend.

## Build

```bash
cd app
npm run build   # type-checks, then builds to app/dist/
npm run preview # serve the production build locally
```

## Deploy to GitHub Pages

The real, source-controlled app lives in `app/`. Everything else at the repo root
(`index.html`, `assets/`, `manifest.json`, `icon-*.png`) is a **generated, committed build
of `app/`** — not hand-written — kept at root so GitHub Pages' classic "Deploy from a branch"
source can serve it directly with zero configuration, since that mode has no build step of its
own and can't run Vite/TypeScript.

**Which setup applies to you depends on this repo's Pages source** (Settings → Pages):

- **Source = "Deploy from a branch"** (GitHub's default, and what this repo currently uses):
  nothing to configure. The root of this branch is already a working build. After merging
  changes into whichever branch Pages is watching, just make sure the root mirror is
  up to date first:
  ```bash
  cd app
  npm run build:root   # builds app/, then copies app/dist/* up to the repo root
  git add -A && git commit -m "Publish build" && git push
  ```
- **Source = "GitHub Actions"** (cleaner long-term option — no committed build output): the
  workflow at `.github/workflows/deploy.yml` builds `app/` and deploys it automatically on every
  push to `main`. Flip **Settings → Pages → Source → GitHub Actions** once, and you can stop
  committing the root mirror.

Either way the app ends up at `https://<your-username>.github.io/<repo-name>/`.

No build secrets are required — AI features run in demo mode by default and only call a real
provider if you add your own API key in **Settings** (stored in your browser only, never sent
anywhere but directly to that provider).

## How it's organized

```
app/                     The real app — this is what you edit
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

scripts/publish-root.mjs  Copies app/dist/* to the repo root (see Deploy section above)

index.html, assets/,      Generated build output, committed for classic Pages branch-deploy.
manifest.json, icon-*.png Regenerate with `npm run build:root` in app/ — never hand-edit.
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

#!/usr/bin/env node
// Copies app/dist/* to the repo root so classic "Deploy from a branch"
// GitHub Pages (which just serves static files as committed, with no build
// step) has a working, up-to-date build to serve. Run via `npm run build:root`
// from inside app/ after any change that should go live.
//
// If this repo's Pages source is later switched to "GitHub Actions" (see
// .github/workflows/deploy.yml), this root mirror becomes unnecessary — the
// workflow builds and deploys directly from app/ without needing it checked in.
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = path.join(rootDir, "app", "dist");

if (!existsSync(distDir)) {
  console.error("app/dist not found — run `npm run build` in app/ first.");
  process.exit(1);
}

// Only ever touch the specific paths we generate at root, never anything else.
const generatedEntries = readdirSync(distDir);
for (const entry of generatedEntries) {
  const target = path.join(rootDir, entry);
  rmSync(target, { recursive: true, force: true });
}

for (const entry of generatedEntries) {
  cpSync(path.join(distDir, entry), path.join(rootDir, entry), { recursive: true });
}

console.log(`Published ${generatedEntries.length} build output(s) from app/dist to repo root:`, generatedEntries.join(", "));

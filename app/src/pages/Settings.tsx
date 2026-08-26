import React, { useRef, useState } from "react";
import { useStore, ALL_CHANNELS } from "../store/store";
import { PageHeader } from "../components/layout";
import { Section } from "../components/common";
import { AIProviderKind, ChannelId } from "../types";
import { downloadJson } from "../lib/utils";
import { toast } from "../store/uiStore";
import { formatUSD, formatUSDPrecise, spendInLast24h } from "../lib/pricing";

const PROVIDER_LABEL: Record<AIProviderKind, string> = {
  mock: "Demo (no API key needed)",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const PROVIDER_MODEL_PLACEHOLDER: Record<AIProviderKind, string> = {
  mock: "",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-5",
};

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetDemoData = useStore((s) => s.resetDemoData);
  const spend = useStore((s) => s.spend);
  const resetSpend = useStore((s) => s.resetSpend);
  const spentLast24h = spendInLast24h(spend.entries);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [draftProvider, setDraftProvider] = useState<AIProviderKind>(settings.ai.provider);
  const [draftKey, setDraftKey] = useState(settings.ai.apiKey);
  const [draftModel, setDraftModel] = useState(settings.ai.model);
  const aiDirty = draftProvider !== settings.ai.provider || draftKey !== settings.ai.apiKey || draftModel !== settings.ai.model;

  function saveAI() {
    updateSettings({ ai: { provider: draftProvider, apiKey: draftKey, model: draftModel } });
    toast("AI settings saved", "success");
  }

  const [draftYoutubeKey, setDraftYoutubeKey] = useState(settings.youtube.apiKey);
  const youtubeDirty = draftYoutubeKey !== settings.youtube.apiKey;

  function saveYoutube() {
    updateSettings({ youtube: { apiKey: draftYoutubeKey } });
    toast("YouTube API key saved", "success");
  }

  function handleExport() {
    downloadJson(`content-os-export-${new Date().toISOString().slice(0, 10)}.json`, exportData());
    toast("Export downloaded", "success");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importData(data);
      setImportMessage(`Imported ${data.videos?.length ?? 0} videos and ${data.ideas?.length ?? 0} ideas.`);
    } catch {
      setImportMessage("That file couldn't be read — make sure it's a Content OS export.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PageHeader title="Settings" subtitle="Configure AI, defaults, theme, and your data." />

      <Section title="AI provider">
        <div className="card flex flex-col gap-4 px-5 py-5">
          <p className="text-xs text-base-400">
            Content OS works fully in demo mode with no API key — every "Generate" button produces channel-aware
            mock content instantly. Add a key and hit Save to switch to live AI generation.
          </p>
          <div>
            <label className="label">Provider</label>
            <select className="input mt-1" value={draftProvider} onChange={(e) => setDraftProvider(e.target.value as AIProviderKind)}>
              {Object.entries(PROVIDER_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {draftProvider !== "mock" && (
            <>
              <div>
                <label className="label">API key</label>
                <input
                  type="password"
                  className="input mt-1"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder="sk-…"
                  autoComplete="off"
                />
                <p className="mt-1 text-[11px] text-base-500">
                  Stored only in this browser's local storage, and only applied once you hit Save below. Requests go
                  directly from your browser to {PROVIDER_LABEL[draftProvider]} — never through any server of ours.
                </p>
              </div>
              <div>
                <label className="label">Model</label>
                <input
                  className="input mt-1"
                  value={draftModel}
                  onChange={(e) => setDraftModel(e.target.value)}
                  placeholder={PROVIDER_MODEL_PLACEHOLDER[draftProvider]}
                />
              </div>
            </>
          )}
          <div className="flex items-center justify-between border-t border-base-700/60 pt-4">
            <span className="text-xs text-base-500">
              {aiDirty ? "Unsaved changes — nothing is active until you save." : settings.ai.provider === "mock" ? "Demo mode active." : "Saved and active."}
            </span>
            <button className="btn-primary" onClick={saveAI} disabled={!aiDirty}>
              Save AI settings
            </button>
          </div>
        </div>
      </Section>

      <Section title="YouTube">
        <div className="card flex flex-col gap-4 px-5 py-5">
          <p className="text-xs text-base-400">
            Pulls real views, likes, and comments straight from YouTube for any video with a URL set — works across
            all 5 channels, not just one. This is <span className="text-emerald-400">free</span>: the YouTube Data
            API's free daily quota is 10,000 units, and a stats lookup costs 1 unit each. CTR, average view
            duration, average % viewed, and subscribers gained aren't available via this public API (they require
            YouTube's private Analytics API with channel-owner OAuth), so those stay manual entry.
          </p>
          <div>
            <label className="label">YouTube Data API key</label>
            <input
              type="password"
              className="input mt-1"
              value={draftYoutubeKey}
              onChange={(e) => setDraftYoutubeKey(e.target.value)}
              placeholder="AIza…"
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-base-500">
              Get one free at console.cloud.google.com → enable "YouTube Data API v3" → Credentials → API key. Stored
              only in this browser, only applied once you hit Save.
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-base-700/60 pt-4">
            <span className="text-xs text-base-500">
              {youtubeDirty ? "Unsaved changes." : settings.youtube.apiKey ? "Saved and active." : "No key set — sync is unavailable until you add one."}
            </span>
            <button className="btn-primary" onClick={saveYoutube} disabled={!youtubeDirty}>
              Save YouTube key
            </button>
          </div>
        </div>
      </Section>

      <Section title="Usage & budget">
        <div className="card flex flex-col gap-4 px-5 py-5">
          <p className="text-xs text-base-400">
            Every "Generate"/"Analyze" button shows an estimated cost before you click it, and a real (non-demo) call
            is blocked once your spend would cross the limit below. These are estimates based on typical response
            size, not your provider's exact bill — check your provider's dashboard for the authoritative number.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-base-400">Total spend</div>
              <div className="text-xl font-semibold text-base-100">{formatUSDPrecise(spend.totalUSD)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-base-400">Last 24 hours</div>
              <div className="text-xl font-semibold text-base-100">{formatUSDPrecise(spentLast24h)}</div>
            </div>
          </div>
          <div className="text-xs text-base-400">
            {spend.entries.length} billed AI call{spend.entries.length === 1 ? "" : "s"} total
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Total budget limit</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-base-400">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="input"
                  value={settings.budgetLimitUSD}
                  onChange={(e) => updateSettings({ budgetLimitUSD: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
            </div>
            <div>
              <label className="label">24-hour budget limit</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-base-400">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  className="input"
                  value={settings.dailyBudgetLimitUSD}
                  onChange={(e) => updateSettings({ dailyBudgetLimitUSD: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-base-500">
            A real AI call is blocked once it would push either the lifetime total or the trailing 24-hour total over
            its limit — and even when both allow it, you still get an explicit confirm-with-cost prompt before the
            call fires. Demo mode never counts against either limit.
          </p>
          <div className="flex items-center justify-between border-t border-base-700/60 pt-4">
            <span className="text-xs text-base-500">
              {spend.totalUSD > 0
                ? `${formatUSD(spend.totalUSD)} of ${formatUSD(settings.budgetLimitUSD)} lifetime · ${formatUSD(spentLast24h)} of ${formatUSD(settings.dailyBudgetLimitUSD)} today`
                : "No spend recorded yet."}
            </span>
            <button
              className="btn-ghost !text-red-400"
              onClick={() => {
                if (spend.totalUSD === 0 || confirm("Reset the spend counter back to $0.00?")) {
                  resetSpend();
                  toast("Spend counter reset", "success");
                }
              }}
            >
              Reset counter
            </button>
          </div>
          {spend.entries.length > 0 && (
            <div className="border-t border-base-700/60 pt-4">
              <div className="label mb-2">Recent AI calls</div>
              <div className="flex flex-col gap-1.5">
                {spend.entries.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <span className="text-base-300">
                      {e.feature} <span className="text-base-500">· {e.provider === "anthropic" ? "Anthropic" : "OpenAI"}</span>
                    </span>
                    <span className="text-base-400">{formatUSDPrecise(e.estCostUSD)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Defaults">
        <div className="card flex flex-col gap-4 px-5 py-5">
          <div>
            <label className="label">Default channel</label>
            <select
              className="input mt-1"
              value={settings.defaultChannelId}
              onChange={(e) => updateSettings({ defaultChannelId: e.target.value as ChannelId })}
            >
              {ALL_CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Default publishing frequency (videos / week)</label>
            <input
              type="number"
              min={1}
              max={7}
              className="input mt-1"
              value={settings.defaultPublishFrequency}
              onChange={(e) => updateSettings({ defaultPublishFrequency: Number(e.target.value) || 1 })}
            />
          </div>
        </div>
      </Section>

      <Section title="Theme">
        <div className="card flex items-center justify-between px-5 py-5">
          <div>
            <div className="text-sm font-medium text-base-100">Dark / light</div>
            <div className="text-xs text-base-400">Content OS is designed dark-first; light mode is available too.</div>
          </div>
          <div className="flex rounded-lg border border-base-600 p-0.5">
            <button
              onClick={() => updateSettings({ theme: "dark" })}
              className={settings.theme === "dark" ? "rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white" : "px-3 py-1.5 text-xs font-medium text-base-300"}
            >
              Dark
            </button>
            <button
              onClick={() => updateSettings({ theme: "light" })}
              className={settings.theme === "light" ? "rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white" : "px-3 py-1.5 text-xs font-medium text-base-300"}
            >
              Light
            </button>
          </div>
        </div>
      </Section>

      <Section title="Data">
        <div className="card flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-base-100">Export</div>
              <div className="text-xs text-base-400">Download all videos, ideas, and settings as JSON.</div>
            </div>
            <button className="btn-secondary" onClick={handleExport}>
              ↓ Export JSON
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-700/60 pt-4">
            <div>
              <div className="text-sm font-medium text-base-100">Import</div>
              <div className="text-xs text-base-400">Replace or merge from a previously exported JSON file.</div>
            </div>
            <button className="btn-secondary" onClick={handleImportClick}>
              ↑ Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
          </div>
          {importMessage && <p className="text-xs text-accent-soft">{importMessage}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-700/60 pt-4">
            <div>
              <div className="text-sm font-medium text-base-100">Reset to demo data</div>
              <div className="text-xs text-base-400">Restore the original sample channels, videos, and ideas.</div>
            </div>
            <button
              className="btn-ghost !text-red-400"
              onClick={() => {
                if (confirm("This replaces all current videos and ideas with the demo data. Continue?")) {
                  resetDemoData();
                  toast("Demo data restored", "success");
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

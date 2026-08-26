import React, { useRef, useState } from "react";
import { useStore, ALL_CHANNELS } from "../store/store";
import { PageHeader } from "../components/layout";
import { Section } from "../components/common";
import { AIProviderKind, ChannelId } from "../types";
import { downloadJson } from "../lib/utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  function handleExport() {
    downloadJson(`content-os-export-${new Date().toISOString().slice(0, 10)}.json`, exportData());
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
            mock content instantly. Add a key to switch to live AI generation.
          </p>
          <div>
            <label className="label">Provider</label>
            <select
              className="input mt-1"
              value={settings.ai.provider}
              onChange={(e) => updateSettings({ ai: { ...settings.ai, provider: e.target.value as AIProviderKind } })}
            >
              {Object.entries(PROVIDER_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {settings.ai.provider !== "mock" && (
            <>
              <div>
                <label className="label">API key</label>
                <input
                  type="password"
                  className="input mt-1"
                  value={settings.ai.apiKey}
                  onChange={(e) => updateSettings({ ai: { ...settings.ai, apiKey: e.target.value } })}
                  placeholder="sk-…"
                  autoComplete="off"
                />
                <p className="mt-1 text-[11px] text-base-500">
                  Stored only in this browser's local storage. Requests go directly from your browser to{" "}
                  {PROVIDER_LABEL[settings.ai.provider]} — never through any server of ours.
                </p>
              </div>
              <div>
                <label className="label">Model</label>
                <input
                  className="input mt-1"
                  value={settings.ai.model}
                  onChange={(e) => updateSettings({ ai: { ...settings.ai, model: e.target.value } })}
                  placeholder={PROVIDER_MODEL_PLACEHOLDER[settings.ai.provider]}
                />
              </div>
            </>
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
                if (confirm("This replaces all current videos and ideas with the demo data. Continue?")) resetDemoData();
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

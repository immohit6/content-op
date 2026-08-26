import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore, getChannel } from "../store/store";
import { CostHint, EmptyState, NextActionBanner, PriorityBadge, ScoreBadge, StageBadge } from "../components/common";
import { STAGE_LABELS, STAGES, Priority, Stage } from "../types";
import { cx } from "../lib/utils";
import { generateResearch, estimateResearchCost } from "../services/researchService";
import { generateScript, estimateScriptCost } from "../services/scriptService";
import { generatePackaging, estimatePackagingCost } from "../services/packagingService";
import { analyzePerformance, estimateAnalysisCost } from "../services/analyticsService";
import { toast } from "../store/uiStore";
import { channelTextColor } from "../lib/color";
import { formatUSD } from "../lib/pricing";
import { useAIBudgetGuard } from "../lib/useAIBudgetGuard";
import { extractVideoId, fetchLiveVideoStats, YouTubeApiError } from "../services/youtubeService";

const TABS = ["Overview", "Research", "Script", "Packaging", "Analytics"] as const;
type Tab = (typeof TABS)[number];

function List({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-xs text-base-500">Nothing yet.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm text-base-200">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-base-500" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function VideoWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const video = useStore((s) => s.videos.find((v) => v.id === id));
  const updateVideo = useStore((s) => s.updateVideo);
  const deleteVideo = useStore((s) => s.deleteVideo);
  const theme = useStore((s) => s.settings.theme);
  const youtubeApiKey = useStore((s) => s.settings.youtube.apiKey);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState<string | null>(null);
  const [syncingYoutube, setSyncingYoutube] = useState(false);
  const { confirmSpend, logSpend, aiSettings } = useAIBudgetGuard();

  if (!video) {
    return (
      <EmptyState
        title="Video not found"
        body="It may have been deleted."
        action={
          <button className="btn-secondary" onClick={() => navigate("/pipeline")}>
            Back to pipeline
          </button>
        }
      />
    );
  }

  const channel = getChannel(video.channelId);

  async function runResearch() {
    const est = estimateResearchCost(video!, aiSettings);
    if (!confirmSpend(est, "AI Research")) return;
    setLoading("research");
    try {
      const research = await generateResearch(video!, aiSettings);
      updateVideo(video!.id, { research });
      logSpend("Research", est);
      toast(`Research generated${est > 0 ? ` · ~${formatUSD(est)}` : ""}`, "success");
    } finally {
      setLoading(null);
    }
  }

  async function runScript() {
    const est = estimateScriptCost(video!, aiSettings);
    if (!confirmSpend(est, "Generate Script")) return;
    setLoading("script");
    try {
      const script = await generateScript(video!, aiSettings);
      updateVideo(video!.id, { script });
      logSpend("Script", est);
      toast(`Script generated${est > 0 ? ` · ~${formatUSD(est)}` : ""}`, "success");
    } finally {
      setLoading(null);
    }
  }

  async function runPackaging() {
    const est = estimatePackagingCost(video!, aiSettings);
    if (!confirmSpend(est, "Generate Packaging")) return;
    setLoading("packaging");
    try {
      const packaging = await generatePackaging(video!, aiSettings);
      updateVideo(video!.id, { packaging });
      logSpend("Packaging", est);
      toast(`Packaging generated${est > 0 ? ` · ~${formatUSD(est)}` : ""}`, "success");
    } finally {
      setLoading(null);
    }
  }

  async function runAnalysis() {
    const est = estimateAnalysisCost(video!, aiSettings);
    if (!confirmSpend(est, "Analyze Performance")) return;
    setLoading("analysis");
    try {
      const aiAnalysis = await analyzePerformance(video!, aiSettings);
      updateVideo(video!.id, { aiAnalysis });
      logSpend("Analysis", est);
      toast(`Performance analysis ready${est > 0 ? ` · ~${formatUSD(est)}` : ""}`, "success");
    } finally {
      setLoading(null);
    }
  }

  async function runYoutubeSync() {
    const videoId = extractVideoId(video!.videoUrl ?? "");
    if (!videoId) {
      toast("Add a valid YouTube video URL above first.", "error");
      return;
    }
    setSyncingYoutube(true);
    try {
      const stats = await fetchLiveVideoStats(videoId, youtubeApiKey);
      updateVideo(video!.id, {
        metrics: { ...(video!.metrics ?? {}), ...stats, syncedAt: new Date().toISOString() },
      });
      toast(`Synced from YouTube: ${stats.views.toLocaleString()} views`, "success");
    } catch (err) {
      toast(err instanceof YouTubeApiError ? err.message : "Couldn't sync from YouTube.", "error");
    } finally {
      setSyncingYoutube(false);
    }
  }

  function onDelete() {
    if (confirm(`Delete "${video!.title}"? This can't be undone.`)) {
      const title = video!.title;
      const channelId = video!.channelId;
      deleteVideo(video!.id);
      toast(`Deleted "${title}"`);
      navigate(`/channel/${channelId}`);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button onClick={() => navigate(-1)} className="w-fit text-xs text-base-400 hover:text-base-200">
        ← Back
      </button>

      <div className="card px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ color: channelTextColor(channel.color, theme), backgroundColor: `${channel.color}1a` }}
              >
                {channel.name}
              </span>
              <StageBadge stage={video.stage} />
            </div>
            <input
              className="w-full bg-transparent text-lg font-semibold text-base-100 outline-none sm:text-xl"
              value={video.title}
              onChange={(e) => updateVideo(video.id, { title: e.target.value })}
            />
          </div>
          <button onClick={onDelete} className="btn-ghost !text-red-400 shrink-0">
            Delete
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input mt-1"
              value={video.stage}
              onChange={(e) => updateVideo(video.id, { stage: e.target.value as Stage })}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input mt-1"
              value={video.priority}
              onChange={(e) => updateVideo(video.id, { priority: e.target.value as Priority })}
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="label">Publish date</label>
            <input
              type="date"
              className="input mt-1"
              value={video.targetPublishDate}
              onChange={(e) => updateVideo(video.id, { targetPublishDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Video URL</label>
            <input
              className="input mt-1"
              value={video.videoUrl ?? ""}
              placeholder="https://youtube.com/..."
              onChange={(e) => updateVideo(video.id, { videoUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Next action</label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input
              className="input flex-1"
              value={video.nextAction}
              onChange={(e) => updateVideo(video.id, { nextAction: e.target.value })}
            />
            <input
              type="number"
              className="input sm:w-28"
              value={video.nextActionMinutes}
              onChange={(e) => updateVideo(video.id, { nextActionMinutes: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="mt-2">
            <NextActionBanner action={video.nextAction} minutes={video.nextActionMinutes} />
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-base-700/60">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium",
              tab === t ? "border-accent text-base-100" : "border-transparent text-base-400 hover:text-base-200"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="flex flex-col gap-4">
          <div className="card px-5 py-4">
            <label className="label">Description</label>
            <textarea
              className="input mt-1.5 min-h-[90px]"
              value={video.description}
              onChange={(e) => updateVideo(video.id, { description: e.target.value })}
            />
          </div>
          <div className="card px-5 py-4">
            <label className="label">Thumbnail concept</label>
            <textarea
              className="input mt-1.5 min-h-[70px]"
              value={video.thumbnailConcept}
              onChange={(e) => updateVideo(video.id, { thumbnailConcept: e.target.value })}
            />
          </div>
          <div className="card px-5 py-4">
            <label className="label">Tags (comma separated)</label>
            <input
              className="input mt-1.5"
              value={video.tags.join(", ")}
              onChange={(e) => updateVideo(video.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
            />
          </div>
          <div className="card px-5 py-4">
            <label className="label">Notes</label>
            <textarea
              className="input mt-1.5 min-h-[90px]"
              value={video.notes}
              onChange={(e) => updateVideo(video.id, { notes: e.target.value })}
            />
          </div>
        </div>
      )}

      {tab === "Research" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-base-100">1. Research</h3>
            <div className="flex items-center gap-2">
              <CostHint costUSD={estimateResearchCost(video, aiSettings)} />
              <button className="btn-primary" onClick={runResearch} disabled={loading === "research"}>
                {loading === "research" ? "Researching…" : "AI Research"}
              </button>
            </div>
          </div>
          {!video.research ? (
            <EmptyState title="No research yet" body="Click AI Research to generate key facts, angles, and sources tailored to this channel." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Key facts</h4>
                <List items={video.research.keyFacts} />
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Context</h4>
                <List items={video.research.context} />
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Interesting angles</h4>
                <List items={video.research.angles} />
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Contrarian viewpoints</h4>
                <List items={video.research.contrarianViewpoints} />
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Story opportunities</h4>
                <List items={video.research.storyOpportunities} />
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Sources</h4>
                <List items={video.research.sources} />
              </div>
              <div className="card px-4 py-4 md:col-span-2">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Needs fact-checking</h4>
                <List items={video.research.factCheckNeeded} />
              </div>
              <div className="card px-4 py-4 md:col-span-2">
                <label className="label">Notes</label>
                <textarea
                  className="input mt-1.5 min-h-[70px]"
                  value={video.research.notes}
                  onChange={(e) => updateVideo(video.id, { research: { ...video.research!, notes: e.target.value } })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Script" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-base-100">2. Script</h3>
            <div className="flex items-center gap-2">
              <CostHint costUSD={estimateScriptCost(video, aiSettings)} />
              <button className="btn-primary" onClick={runScript} disabled={loading === "script"}>
                {loading === "script" ? "Writing…" : "Generate Script"}
              </button>
            </div>
          </div>
          {!video.script ? (
            <EmptyState title="No script yet" body="Generate 5 hooks, a full script, and retention beats matched to this channel's voice." />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Hooks</h4>
                <div className="flex flex-col gap-2">
                  {video.script.hooks.map((h, i) => (
                    <div
                      key={i}
                      className={cx(
                        "rounded-lg border px-3 py-2.5",
                        i === video.script!.recommendedHookIndex ? "border-accent/50 bg-accent/10" : "border-base-700 bg-base-850"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-base-400">{h.angle}</span>
                        <div className="flex items-center gap-2">
                          {i === video.script!.recommendedHookIndex && (
                            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">BEST</span>
                          )}
                          <ScoreBadge label="score" value={h.score} />
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-base-100">{h.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Opening</h4>
                <p className="text-sm text-base-100">{video.script.opening}</p>
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Full script</h4>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-base-200">{video.script.fullScript}</pre>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="card px-4 py-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Retention beats</h4>
                  <List items={video.script.retentionBeats} />
                </div>
                <div className="card px-4 py-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Pattern interrupts</h4>
                  <List items={video.script.patternInterrupts} />
                </div>
                <div className="card px-4 py-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">B-roll suggestions</h4>
                  <List items={video.script.bRollSuggestions} />
                </div>
                <div className="card px-4 py-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">CTA</h4>
                  <p className="text-sm text-base-200">{video.script.cta}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Packaging" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-base-100">3. Packaging</h3>
            <div className="flex items-center gap-2">
              <CostHint costUSD={estimatePackagingCost(video, aiSettings)} />
              <button className="btn-primary" onClick={runPackaging} disabled={loading === "packaging"}>
                {loading === "packaging" ? "Generating…" : "Generate Packaging"}
              </button>
            </div>
          </div>
          {!video.packaging ? (
            <EmptyState title="No packaging yet" body="Generate 10 titles, thumbnail concept, description, tags, chapters and a pinned comment." />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Titles</h4>
                <div className="flex flex-col gap-1.5">
                  {video.packaging.titles.map((t, i) => (
                    <div
                      key={i}
                      className={cx(
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                        i === video.packaging!.recommendedTitleIndex ? "border-accent/50 bg-accent/10" : "border-base-700 bg-base-850"
                      )}
                    >
                      <span className="text-sm text-base-100">{t.title}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <ScoreBadge label="CTR" value={t.ctrScore} />
                        <button
                          className="btn-ghost !px-2 !py-1 text-[11px]"
                          onClick={() => updateVideo(video.id, { title: t.title })}
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="card px-4 py-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Thumbnail concept</h4>
                  <p className="text-sm text-base-200">{video.packaging.thumbnailConcept}</p>
                  <h4 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-base-400">Thumbnail text</h4>
                  <p className="text-sm font-semibold text-base-100">{video.packaging.thumbnailText}</p>
                </div>
                <div className="card px-4 py-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {video.packaging.tags.map((t) => (
                      <span key={t} className="rounded-full bg-base-800 px-2 py-0.5 text-xs text-base-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Description</h4>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-base-200">{video.packaging.description}</pre>
                <button className="btn-secondary mt-3" onClick={() => updateVideo(video.id, { description: video.packaging!.description })}>
                  Use as video description
                </button>
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Chapters</h4>
                <div className="flex flex-col gap-1">
                  {video.packaging.chapters.map((c, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="w-12 shrink-0 text-base-400">{c.time}</span>
                      <span className="text-base-200">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Pinned comment</h4>
                <p className="text-sm text-base-200">{video.packaging.pinnedComment}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="flex flex-col gap-4">
          <div className="card px-4 py-4">
            <h3 className="mb-3 text-sm font-semibold text-base-100">Performance metrics</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["views", "Views"],
                  ["ctr", "CTR %"],
                  ["avgViewDurationSec", "Avg. view (sec)"],
                  ["avgPercentViewed", "Avg. % viewed"],
                  ["likes", "Likes"],
                  ["comments", "Comments"],
                  ["subscribersGained", "Subs gained"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type="number"
                    className="input mt-1"
                    value={video.metrics?.[key] ?? ""}
                    onChange={(e) =>
                      updateVideo(video.id, {
                        metrics: { ...(video.metrics ?? {}), [key]: e.target.value === "" ? undefined : Number(e.target.value) },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-base-100">AI Performance Analysis</h3>
            <div className="flex items-center gap-2">
              <CostHint costUSD={estimateAnalysisCost(video, aiSettings)} />
              <button className="btn-primary" onClick={runAnalysis} disabled={loading === "analysis"}>
                {loading === "analysis" ? "Analyzing…" : "Analyze Performance"}
              </button>
            </div>
          </div>
          {!video.aiAnalysis ? (
            <EmptyState title="No analysis yet" body="Enter metrics above, then run the AI performance analysis for concrete conclusions." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(
                [
                  ["What worked", video.aiAnalysis.whatWorked],
                  ["What didn't", video.aiAnalysis.whatDidnt],
                  ["Why", video.aiAnalysis.why],
                  ["What to repeat", video.aiAnalysis.repeat],
                  ["What to stop", video.aiAnalysis.stop],
                  ["Next video should test", video.aiAnalysis.nextTest],
                ] as const
              ).map(([label, text]) => (
                <div key={label} className="card px-4 py-3.5">
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-base-400">{label}</h4>
                  <p className="text-sm text-base-200">{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, getChannel } from "../store/store";
import { PageHeader } from "../components/layout";
import { ChannelPill, CostHint, EmptyState, ScoreBadge } from "../components/common";
import { recommendNextVideos, estimateStrategyCost } from "../services/strategyService";
import { StrategyRecommendation } from "../types";
import { toast } from "../store/uiStore";
import { formatUSD, isRealProvider } from "../lib/pricing";
import { useAIBudgetGuard } from "../lib/useAIBudgetGuard";

export default function Strategist() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const ideas = useStore((s) => s.ideas);
  const channels = useStore((s) => s.channels);
  const addVideo = useStore((s) => s.addVideo);
  const { confirmSpend, logSpend, aiSettings } = useAIBudgetGuard();
  const [recs, setRecs] = useState<StrategyRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const est = estimateStrategyCost(channels, videos, ideas, aiSettings);
  const usesRealProvider = isRealProvider(aiSettings.provider, aiSettings.apiKey);

  async function refresh() {
    if (!confirmSpend(est, "Generate recommendations")) return;
    setLoading(true);
    try {
      const result = await recommendNextVideos(channels, videos, ideas, aiSettings);
      setRecs(result);
      setHasRun(true);
      logSpend("Strategy", est);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Demo mode is free, so keep the page instantly useful on load. A real
    // provider costs money per call, so require an explicit click instead of
    // silently spending the moment this page is opened.
    if (!usesRealProvider) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createFromRec(rec: StrategyRecommendation) {
    const v = addVideo({
      channelId: rec.channelId,
      title: rec.title,
      stage: "idea",
      priority: "medium",
      nextAction: "Kick off research for this video",
      nextActionMinutes: 30,
      notes: `Angle: ${rec.angle}\n\nWhy this video: ${rec.reason}`,
    });
    toast(`Video created: "${v.title}"`, "success");
    navigate(`/video/${v.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Strategist"
        subtitle="What should I make next? Recommendations based on channel balance, gaps, and performance."
        action={
          <div className="flex items-center gap-2">
            <CostHint costUSD={est} />
            <button className="btn-primary" onClick={refresh} disabled={loading}>
              {loading ? "Thinking…" : hasRun ? "↻ Refresh recommendations" : "Generate recommendations"}
            </button>
          </div>
        }
      />

      {!recs || recs.length === 0 ? (
        <EmptyState
          title={
            loading
              ? "Analyzing your content database…"
              : usesRealProvider && !hasRun
              ? "Ready when you are"
              : "No recommendations yet"
          }
          body={
            usesRealProvider && !hasRun && !loading
              ? `This calls ${aiSettings.provider === "anthropic" ? "Anthropic" : "OpenAI"} and costs ~${formatUSD(est)}. Click "Generate recommendations" above when you're ready.`
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {recs.map((rec, i) => {
            const channel = getChannel(rec.channelId);
            return (
              <div key={i} className="card px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent-soft">
                        {i + 1}
                      </span>
                      <ChannelPill channel={channel} />
                    </div>
                    <div className="text-base font-semibold text-base-100">{rec.title}</div>
                    <p className="mt-1 text-xs text-base-400">{rec.angle}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <ScoreBadge label="Est. CTR" value={rec.estCtr} />
                    <ScoreBadge label="Est. retention" value={rec.estRetention} />
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-base-850 px-3 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-base-500">Why this video?</div>
                  <p className="mt-0.5 text-sm text-base-200">{rec.reason}</p>
                </div>
                <div className="mt-3 flex justify-end">
                  <button className="btn-secondary" onClick={() => createFromRec(rec)}>
                    + Create as video
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

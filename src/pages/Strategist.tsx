import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, ALL_CHANNELS } from "../store/store";
import { CHANNEL_MAP } from "../data/channels";
import { PageHeader } from "../components/layout";
import { ChannelPill, EmptyState, ScoreBadge } from "../components/common";
import { recommendNextVideos } from "../services/strategyService";
import { StrategyRecommendation } from "../types";

export default function Strategist() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const ideas = useStore((s) => s.ideas);
  const addVideo = useStore((s) => s.addVideo);
  const aiSettings = useStore((s) => s.settings.ai);
  const [recs, setRecs] = useState<StrategyRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const result = await recommendNextVideos(ALL_CHANNELS, videos, ideas, aiSettings);
      setRecs(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
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
    navigate(`/video/${v.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Strategist"
        subtitle="What should I make next? Recommendations based on channel balance, gaps, and performance."
        action={
          <button className="btn-primary" onClick={refresh} disabled={loading}>
            {loading ? "Thinking…" : "↻ Refresh recommendations"}
          </button>
        }
      />

      {!recs || recs.length === 0 ? (
        <EmptyState title={loading ? "Analyzing your content database…" : "No recommendations yet"} />
      ) : (
        <div className="flex flex-col gap-4">
          {recs.map((rec, i) => {
            const channel = CHANNEL_MAP[rec.channelId];
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

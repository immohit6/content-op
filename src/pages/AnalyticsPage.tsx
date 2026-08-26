import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, ALL_CHANNELS } from "../store/store";
import { CHANNEL_MAP } from "../data/channels";
import { PageHeader } from "../components/layout";
import { ChannelPill, EmptyState, StatCard } from "../components/common";
import { formatShortDate } from "../lib/utils";
import { analyzePerformance } from "../services/analyticsService";
import { toast } from "../store/uiStore";

const METRIC_FIELDS = [
  ["views", "Views"],
  ["ctr", "CTR %"],
  ["avgViewDurationSec", "Avg. view (sec)"],
  ["avgPercentViewed", "Avg. % viewed"],
  ["likes", "Likes"],
  ["comments", "Comments"],
  ["subscribersGained", "Subs gained"],
] as const;

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const updateVideo = useStore((s) => s.updateVideo);
  const aiSettings = useStore((s) => s.settings.ai);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const published = useMemo(
    () =>
      videos
        .filter((v) => v.stage === "published" || v.stage === "analytics")
        .sort((a, b) => new Date(b.targetPublishDate).getTime() - new Date(a.targetPublishDate).getTime()),
    [videos]
  );

  const totals = useMemo(() => {
    const withViews = published.filter((v) => v.metrics?.views);
    const totalViews = withViews.reduce((sum, v) => sum + (v.metrics?.views ?? 0), 0);
    const avgCtr = withViews.length ? withViews.reduce((s, v) => s + (v.metrics?.ctr ?? 0), 0) / withViews.length : 0;
    const avgRetention = withViews.length ? withViews.reduce((s, v) => s + (v.metrics?.avgPercentViewed ?? 0), 0) / withViews.length : 0;
    return { totalViews, avgCtr, avgRetention, count: published.length };
  }, [published]);

  async function runAnalysis(videoId: string) {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return;
    setLoadingId(videoId);
    try {
      const aiAnalysis = await analyzePerformance(video, aiSettings);
      updateVideo(videoId, { aiAnalysis });
      toast("Performance analysis ready", "success");
      setExpanded(videoId);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" subtitle="Enter results, then get concrete conclusions — not generic advice." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Published videos" value={totals.count} />
        <StatCard label="Total views" value={totals.totalViews.toLocaleString()} />
        <StatCard label="Avg. CTR" value={`${totals.avgCtr.toFixed(1)}%`} />
        <StatCard label="Avg. % viewed" value={`${totals.avgRetention.toFixed(0)}%`} />
      </div>

      {published.length === 0 ? (
        <EmptyState title="No published videos yet" body="Once you publish something, log its metrics here." />
      ) : (
        <div className="flex flex-col gap-3">
          {published.map((v) => {
            const channel = CHANNEL_MAP[v.channelId];
            const isExpanded = expanded === v.id;
            return (
              <div key={v.id} className="card px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <ChannelPill channel={channel} />
                      <span className="text-xs text-base-500">{formatShortDate(v.targetPublishDate)}</span>
                    </div>
                    <button className="text-left text-sm font-semibold text-base-100 hover:text-accent-soft" onClick={() => navigate(`/video/${v.id}`)}>
                      {v.title}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => setExpanded(isExpanded ? null : v.id)}>
                      {isExpanded ? "Hide" : "Edit metrics"}
                    </button>
                    <button className="btn-primary" onClick={() => runAnalysis(v.id)} disabled={loadingId === v.id}>
                      {loadingId === v.id ? "Analyzing…" : "AI Analysis"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-7">
                  {METRIC_FIELDS.map(([key, label]) => (
                    <div key={key}>
                      <div className="text-[10px] uppercase tracking-wide text-base-500">{label}</div>
                      <div className="text-sm font-semibold text-base-100">{v.metrics?.[key] ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-base-700/60 pt-4 sm:grid-cols-4">
                    {METRIC_FIELDS.map(([key, label]) => (
                      <div key={key}>
                        <label className="label">{label}</label>
                        <input
                          type="number"
                          className="input mt-1"
                          value={v.metrics?.[key] ?? ""}
                          onChange={(e) =>
                            updateVideo(v.id, {
                              metrics: { ...(v.metrics ?? {}), [key]: e.target.value === "" ? undefined : Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {v.aiAnalysis && (
                  <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-base-700/60 pt-4 sm:grid-cols-2">
                    {(
                      [
                        ["What worked", v.aiAnalysis.whatWorked],
                        ["What didn't", v.aiAnalysis.whatDidnt],
                        ["Why", v.aiAnalysis.why],
                        ["Repeat", v.aiAnalysis.repeat],
                        ["Stop", v.aiAnalysis.stop],
                        ["Next video should test", v.aiAnalysis.nextTest],
                      ] as const
                    ).map(([label, text]) => (
                      <div key={label} className="rounded-lg bg-base-850 px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-base-500">{label}</div>
                        <div className="mt-0.5 text-xs text-base-200">{text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, ALL_CHANNELS } from "../store/store";
import { getChannel } from "../data/channels";
import { PageHeader } from "../components/layout";
import { ChannelPill, CostHint, EmptyState, StatCard } from "../components/common";
import { formatShortDate } from "../lib/utils";
import { analyzePerformance, estimateAnalysisCost } from "../services/analyticsService";
import { toast } from "../store/uiStore";
import { formatUSD } from "../lib/pricing";
import { useAIBudgetGuard } from "../lib/useAIBudgetGuard";
import { extractVideoId, fetchLiveVideoStats, YouTubeApiError } from "../services/youtubeService";
import { ImportYouTubeModal } from "../components/ImportYouTubeModal";
import { Video } from "../types";

const METRIC_FIELDS = [
  ["views", "Views", true],
  ["ctr", "CTR %", false],
  ["avgViewDurationSec", "Avg. view (sec)", false],
  ["avgPercentViewed", "Avg. % viewed", false],
  ["likes", "Likes", true],
  ["comments", "Comments", true],
  ["subscribersGained", "Subs gained", false],
] as const;

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const updateVideo = useStore((s) => s.updateVideo);
  const youtubeApiKey = useStore((s) => s.settings.youtube.apiKey);
  const { confirmSpend, logSpend, aiSettings } = useAIBudgetGuard();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showImport, setShowImport] = useState(false);

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

  const byChannel = useMemo(() => {
    return ALL_CHANNELS.map((c) => {
      const chVideos = published.filter((v) => v.channelId === c.id);
      const withViews = chVideos.filter((v) => v.metrics?.views);
      return {
        channel: c,
        publishedCount: chVideos.length,
        views: withViews.reduce((s, v) => s + (v.metrics?.views ?? 0), 0),
        likes: withViews.reduce((s, v) => s + (v.metrics?.likes ?? 0), 0),
        comments: withViews.reduce((s, v) => s + (v.metrics?.comments ?? 0), 0),
        synced: withViews.length,
      };
    });
  }, [published]);

  async function syncOne(v: Video, { silent }: { silent?: boolean } = {}): Promise<boolean> {
    const videoId = extractVideoId(v.videoUrl ?? "");
    if (!videoId) {
      if (!silent) toast("Add a valid YouTube video URL on this video first.", "error");
      return false;
    }
    try {
      const stats = await fetchLiveVideoStats(videoId, youtubeApiKey);
      updateVideo(v.id, { metrics: { ...(v.metrics ?? {}), ...stats, syncedAt: new Date().toISOString() } });
      if (!silent) toast(`Synced "${v.title}": ${stats.views.toLocaleString()} views`, "success");
      return true;
    } catch (err) {
      if (!silent) toast(err instanceof YouTubeApiError ? err.message : "Couldn't sync from YouTube.", "error");
      return false;
    }
  }

  async function syncVideo(v: Video) {
    setSyncingId(v.id);
    try {
      await syncOne(v);
    } finally {
      setSyncingId(null);
    }
  }

  async function syncAll() {
    if (!youtubeApiKey.trim()) {
      toast("Add a YouTube API key in Settings first.", "error");
      return;
    }
    const syncable = published.filter((v) => extractVideoId(v.videoUrl ?? ""));
    if (syncable.length === 0) {
      toast("No published videos have a YouTube URL set yet — paste one on each video below.", "error");
      return;
    }
    setSyncingAll(true);
    let ok = 0;
    try {
      for (const v of syncable) {
        // eslint-disable-next-line no-await-in-loop
        if (await syncOne(v, { silent: true })) ok++;
      }
      toast(`Synced ${ok} of ${syncable.length} video${syncable.length === 1 ? "" : "s"} from YouTube, across all channels`, ok > 0 ? "success" : "error");
    } finally {
      setSyncingAll(false);
    }
  }

  async function runAnalysis(videoId: string) {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return;
    const est = estimateAnalysisCost(video, aiSettings);
    if (!confirmSpend(est, "Analyze Performance")) return;
    setLoadingId(videoId);
    try {
      const aiAnalysis = await analyzePerformance(video, aiSettings);
      updateVideo(videoId, { aiAnalysis });
      logSpend("Analysis", est);
      toast(`Performance analysis ready${est > 0 ? ` · ~${formatUSD(est)}` : ""}`, "success");
      setExpanded(videoId);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle="Real views/likes/comments from YouTube, plus AI conclusions — not generic advice."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setShowImport(true)}>
              ↓ Import old videos
            </button>
            <button className="btn-primary" onClick={syncAll} disabled={syncingAll}>
              {syncingAll ? "Syncing…" : "↻ Sync all from YouTube"}
            </button>
          </div>
        }
      />

      <ImportYouTubeModal open={showImport} onClose={() => setShowImport(false)} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Published videos" value={totals.count} />
        <StatCard label="Total views" value={totals.totalViews.toLocaleString()} />
        <StatCard label="Avg. CTR" value={`${totals.avgCtr.toFixed(1)}%`} sub="manual entry" />
        <StatCard label="Avg. % viewed" value={`${totals.avgRetention.toFixed(0)}%`} sub="manual entry" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-base-100">By channel</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {byChannel.map(({ channel, publishedCount, views, likes, comments, synced }) => (
            <div key={channel.id} className="card px-4 py-4">
              <ChannelPill channel={channel} />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-base font-semibold text-base-100">{views.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wide text-base-500">Views</div>
                </div>
                <div>
                  <div className="text-base font-semibold text-base-100">{likes.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wide text-base-500">Likes</div>
                </div>
                <div>
                  <div className="text-base font-semibold text-base-100">{comments.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wide text-base-500">Comments</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-base-500">
                {publishedCount} published · {synced} synced live
              </div>
            </div>
          ))}
        </div>
      </section>

      {published.length === 0 ? (
        <EmptyState title="No published videos yet" body="Once you publish something, sync or log its metrics here." />
      ) : (
        <div className="flex flex-col gap-3">
          {published.map((v) => {
            const channel = getChannel(v.channelId);
            const isExpanded = expanded === v.id;
            const canSync = !!extractVideoId(v.videoUrl ?? "");
            return (
              <div key={v.id} className="card px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <ChannelPill channel={channel} />
                      <span className="text-xs text-base-500">{formatShortDate(v.targetPublishDate)}</span>
                      {v.metrics?.syncedAt && (
                        <span className="text-[10px] text-emerald-400">● live-synced</span>
                      )}
                    </div>
                    <button className="text-left text-sm font-semibold text-base-100 hover:text-accent-soft" onClick={() => navigate(`/video/${v.id}`)}>
                      {v.title}
                    </button>
                    {!canSync && (
                      <input
                        className="input mt-1.5 w-full max-w-sm text-xs"
                        value={v.videoUrl ?? ""}
                        placeholder="Paste the YouTube URL to enable syncing…"
                        onChange={(e) => updateVideo(v.id, { videoUrl: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => syncVideo(v)}
                      disabled={syncingId === v.id || !canSync}
                      title={canSync ? "Pull live views/likes/comments from YouTube" : "Add a YouTube video URL first"}
                    >
                      {syncingId === v.id ? "Syncing…" : "↻ Sync"}
                    </button>
                    <button className="btn-secondary" onClick={() => setExpanded(isExpanded ? null : v.id)}>
                      {isExpanded ? "Hide" : "Edit metrics"}
                    </button>
                    <CostHint costUSD={estimateAnalysisCost(v, aiSettings)} />
                    <button className="btn-primary" onClick={() => runAnalysis(v.id)} disabled={loadingId === v.id}>
                      {loadingId === v.id ? "Analyzing…" : "AI Analysis"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-7">
                  {METRIC_FIELDS.map(([key, label, isLive]) => (
                    <div key={key}>
                      <div className="text-[10px] uppercase tracking-wide text-base-500">
                        {label}
                        {isLive && <span className="ml-1 text-emerald-500">●</span>}
                      </div>
                      <div className="text-sm font-semibold text-base-100">{v.metrics?.[key] ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-base-700/60 pt-4">
                    <p className="mb-3 text-[11px] text-base-500">
                      <span className="text-emerald-500">●</span> Views/Likes/Comments can be pulled live from
                      YouTube (Sync button above). The rest aren't available via the public API, so enter them
                      manually if you have them from YouTube Studio.
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

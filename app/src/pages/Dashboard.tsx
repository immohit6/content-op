import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, ALL_CHANNELS, priorityRank } from "../store/store";
import { PageHeader } from "../components/layout";
import { EmptyState, PriorityDot } from "../components/common";
import { STAGE_VERB, PRODUCTION_STAGES } from "../lib/pipeline";
import { formatShortDate, relativeDayLabel } from "../lib/utils";
import { Video } from "../types";

function TodayItem({ video, onClick }: { video: Video; onClick: () => void }) {
  const verb = STAGE_VERB[video.stage];
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-base-800"
    >
      <PriorityDot priority={video.priority} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-base-100">
          <span className="font-medium">{verb}:</span> {video.title}
        </div>
        <div className="truncate text-xs text-base-400">{video.nextAction}</div>
      </div>
      <span className="shrink-0 text-xs text-base-500">{relativeDayLabel(video.targetPublishDate)}</span>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);

  const todayItems = useMemo(() => {
    const actionable = videos.filter((v) => v.stage !== "published" && v.stage !== "analytics");
    return [...actionable]
      .sort((a, b) => {
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        return new Date(a.targetPublishDate).getTime() - new Date(b.targetPublishDate).getTime();
      })
      .slice(0, 6);
  }, [videos]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" subtitle="What should I work on today?" />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-base-100">Today</h2>
        <div className="card divide-y divide-base-700/60 px-1 py-1">
          {todayItems.length === 0 ? (
            <EmptyState title="Nothing urgent right now" body="Add a video or idea to get started." />
          ) : (
            todayItems.map((v) => <TodayItem key={v.id} video={v} onClick={() => navigate(`/video/${v.id}`)} />)
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-base-100">Channels</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ALL_CHANNELS.map((c) => {
            const chVideos = videos.filter((v) => v.channelId === c.id);
            const active = chVideos.filter((v) => v.stage !== "published" && v.stage !== "analytics").length;
            const inProduction = chVideos.filter((v) => PRODUCTION_STAGES.includes(v.stage)).length;
            const publishedThisMonth = chVideos.filter(
              (v) =>
                (v.stage === "published" || v.stage === "analytics") &&
                new Date(v.targetPublishDate).getTime() >= monthStart
            ).length;
            const next = [...chVideos]
              .filter((v) => v.stage !== "published" && v.stage !== "analytics")
              .sort((a, b) => new Date(a.targetPublishDate).getTime() - new Date(b.targetPublishDate).getTime())[0];
            const onTrack = publishedThisMonth >= c.publishFrequencyPerWeek * (now.getDate() / 7);

            return (
              <button
                key={c.id}
                onClick={() => navigate(`/channel/${c.id}`)}
                className="card flex flex-col gap-3 px-4 py-4 text-left transition-transform hover:-translate-y-0.5 hover:border-base-500"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-semibold text-base-100">{c.name}</span>
                </div>
                <p className="text-xs text-base-400 line-clamp-2">{c.tagline}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-base font-semibold text-base-100">{active}</div>
                    <div className="text-[10px] uppercase tracking-wide text-base-500">Active</div>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-base-100">{inProduction}</div>
                    <div className="text-[10px] uppercase tracking-wide text-base-500">In prod.</div>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-base-100">{publishedThisMonth}</div>
                    <div className="text-[10px] uppercase tracking-wide text-base-500">This month</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-base-700/60 pt-2.5 text-xs">
                  <span className="truncate text-base-400">
                    Next: <span className="text-base-200">{next ? next.title : "—"}</span>
                  </span>
                  <span className={onTrack ? "text-emerald-400" : "text-amber-300"}>
                    {onTrack ? "On track" : "Behind"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

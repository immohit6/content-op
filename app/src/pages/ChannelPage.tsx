import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store/store";
import { PageHeader } from "../components/layout";
import { EmptyState, Modal, NextActionBanner, PriorityBadge, StageBadge, StatCard } from "../components/common";
import { PRODUCTION_STAGES } from "../lib/pipeline";
import { formatShortDate, todayIso } from "../lib/utils";
import { Priority, Stage } from "../types";
import { toast } from "../store/uiStore";

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const channels = useStore((s) => s.channels);
  const channel = id ? channels.find((c) => c.id === id) : undefined;
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const addVideo = useStore((s) => s.addVideo);
  const [filter, setFilter] = useState<Stage | "all">("all");
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [date, setDate] = useState(todayIso());

  const chVideos = useMemo(
    () => (channel ? videos.filter((v) => v.channelId === channel.id) : []),
    [videos, channel]
  );

  if (!channel) {
    return <EmptyState title="Channel not found" />;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const active = chVideos.filter((v) => v.stage !== "published" && v.stage !== "analytics").length;
  const inProduction = chVideos.filter((v) => PRODUCTION_STAGES.includes(v.stage)).length;
  const publishedThisMonth = chVideos.filter(
    (v) => (v.stage === "published" || v.stage === "analytics") && new Date(v.targetPublishDate).getTime() >= monthStart
  ).length;

  const filtered = filter === "all" ? chVideos : chVideos.filter((v) => v.stage === filter);
  const sorted = [...filtered].sort((a, b) => new Date(a.targetPublishDate).getTime() - new Date(b.targetPublishDate).getTime());

  function createVideo() {
    if (!title.trim() || !channel) return;
    const v = addVideo({
      channelId: channel.id,
      title: title.trim(),
      priority,
      targetPublishDate: date,
      nextAction: "Kick off research for this video",
      nextActionMinutes: 30,
    });
    setShowNew(false);
    setTitle("");
    toast(`Video created: "${v.title}"`, "success");
    navigate(`/video/${v.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={channel.name}
        subtitle={channel.tagline}
        action={
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            + New Video
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {channel.niche.map((n) => (
          <span key={n} className="rounded-full border border-base-600 bg-base-850 px-2.5 py-1 text-xs text-base-300">
            {n}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active" value={active} />
        <StatCard label="In production" value={inProduction} />
        <StatCard label="Published this month" value={publishedThisMonth} />
        <StatCard label="Cadence target" value={`${channel.publishFrequencyPerWeek}/wk`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "idea", "research", "script", "record", "edit", "thumbnail", "seo", "scheduled", "published", "analytics"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={
                filter === s
                  ? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
                  : "rounded-full bg-base-800 px-3 py-1 text-xs font-medium text-base-300 hover:bg-base-700"
              }
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          )
        )}
      </div>

      <div className="card divide-y divide-base-700/60">
        {sorted.length === 0 ? (
          <EmptyState title="No videos in this view" action={<button className="btn-secondary" onClick={() => setShowNew(true)}>+ New Video</button>} />
        ) : (
          sorted.map((v) => (
            <button
              key={v.id}
              onClick={() => navigate(`/video/${v.id}`)}
              className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-base-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StageBadge stage={v.stage} />
                  <PriorityBadge priority={v.priority} />
                </div>
                <div className="mt-1 truncate text-sm font-medium text-base-100">{v.title}</div>
                <div className="truncate text-xs text-base-400">{v.nextAction}</div>
              </div>
              <div className="shrink-0 text-xs text-base-400">{formatShortDate(v.targetPublishDate)}</div>
            </button>
          ))
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title={`New video · ${channel.name}`}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Title</label>
            <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input mt-1" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="label">Target publish date</label>
              <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <NextActionBanner action="Kick off research for this video" minutes={30} />
          <div className="mt-2 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setShowNew(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={createVideo} disabled={!title.trim()}>
              Create video
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

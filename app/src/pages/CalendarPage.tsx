import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, getChannel } from "../store/store";
import { PageHeader } from "../components/layout";
import { Modal } from "../components/common";
import { cx, formatDate, monthLabel, todayIso, toLocalIso } from "../lib/utils";
import { ChannelId, Priority, Video } from "../types";
import { toast } from "../store/uiStore";

const toIso = toLocalIso;

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const channels = useStore((s) => s.channels);
  const updateVideo = useStore((s) => s.updateVideo);
  const addVideo = useStore((s) => s.addVideo);
  const defaultChannelId = useStore((s) => s.settings.defaultChannelId);
  const [mode, setMode] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState(new Date());
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const [newDate, setNewDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newChannel, setNewChannel] = useState<ChannelId>(defaultChannelId);
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  function openNewVideo(iso: string) {
    setNewChannel(defaultChannelId);
    setNewTitle("");
    setNewPriority("medium");
    setNewDate(iso);
  }

  function createVideoOnDate() {
    if (!newTitle.trim() || !newDate) return;
    const v = addVideo({
      channelId: newChannel,
      title: newTitle.trim(),
      priority: newPriority,
      targetPublishDate: newDate,
      nextAction: "Kick off research for this video",
      nextActionMinutes: 30,
    });
    toast(`Video created: "${v.title}"`, "success");
    setNewDate(null);
    navigate(`/video/${v.id}`);
  }

  const byDate = useMemo(() => {
    const map: Record<string, Video[]> = {};
    for (const v of videos) {
      (map[v.targetPublishDate] ??= []).push(v);
    }
    return map;
  }, [videos]);

  function handleDrop(e: React.DragEvent, iso: string) {
    e.preventDefault();
    const videoId = e.dataTransfer.getData("text/plain");
    if (videoId) {
      const v = videos.find((x) => x.id === videoId);
      updateVideo(videoId, { targetPublishDate: iso });
      if (v) toast(`Moved "${v.title}" to ${formatDate(iso)}`, "success");
    }
    setDragOverDay(null);
  }

  function DayCell({ date, muted }: { date: Date; muted?: boolean }) {
    const iso = toIso(date);
    const items = byDate[iso] ?? [];
    const isToday = iso === todayIso();
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverDay(iso);
        }}
        onDragLeave={() => setDragOverDay((d) => (d === iso ? null : d))}
        onDrop={(e) => handleDrop(e, iso)}
        onClick={() => openNewVideo(iso)}
        className={cx(
          "group flex min-h-[110px] cursor-pointer flex-col gap-1 rounded-lg border p-1.5 transition-colors hover:border-accent/40",
          muted ? "border-base-800 bg-base-900/30" : "border-base-700/50 bg-base-900/60",
          dragOverDay === iso && "border-accent bg-accent/10"
        )}
        title="Click to add a video on this day"
      >
        <div className="flex items-center justify-between">
          <span className={cx("text-xs", isToday ? "font-bold text-accent-soft" : muted ? "text-base-600" : "text-base-400")}>
            {date.getDate()}
          </span>
          <span className="text-xs text-base-500 opacity-0 transition-opacity group-hover:opacity-100">+</span>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {items.map((v) => {
            const channel = getChannel(v.channelId);
            return (
              <div
                key={v.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", v.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/video/${v.id}`);
                }}
                className="cursor-pointer truncate rounded px-1.5 py-1 text-[11px] font-medium text-white"
                style={{ backgroundColor: `${channel.color}cc` }}
                title={v.title}
              >
                {v.title}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const monthGrid = useMemo(() => {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const gridStart = startOfWeek(first);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [anchor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [anchor]);

  function shift(n: number) {
    const d = new Date(anchor);
    if (mode === "month") d.setMonth(d.getMonth() + n);
    else d.setDate(d.getDate() + n * 7);
    setAnchor(d);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Content Calendar"
        subtitle="Drag a video onto a new date to reschedule it."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-base-600 p-0.5">
              <button
                onClick={() => setMode("week")}
                className={cx("rounded-md px-2.5 py-1 text-xs font-medium", mode === "week" ? "bg-accent text-white" : "text-base-300")}
              >
                Week
              </button>
              <button
                onClick={() => setMode("month")}
                className={cx("rounded-md px-2.5 py-1 text-xs font-medium", mode === "month" ? "bg-accent text-white" : "text-base-300")}
              >
                Month
              </button>
            </div>
          </div>
        }
      />

      <div className="flex items-center justify-between">
        <button className="btn-secondary" onClick={() => shift(-1)}>
          ← Prev
        </button>
        <div className="text-sm font-semibold text-base-100">
          {mode === "month" ? monthLabel(anchor.getFullYear(), anchor.getMonth()) : `Week of ${weekDays[0].toLocaleDateString()}`}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setAnchor(new Date())}>
            Today
          </button>
          <button className="btn-secondary" onClick={() => shift(1)}>
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-base-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {mode === "month" ? (
        <div className="grid grid-cols-7 gap-1.5">
          {monthGrid.map((d, i) => (
            <DayCell key={i} date={d} muted={d.getMonth() !== anchor.getMonth()} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => (
            <DayCell key={i} date={d} />
          ))}
        </div>
      )}

      <div className="card px-4 py-3 text-xs text-base-400">
        Tip: click any day to add a video there, or drag an existing video card onto a different day to reschedule it.
      </div>

      <Modal open={!!newDate} onClose={() => setNewDate(null)} title={newDate ? `New video · ${formatDate(newDate)}` : "New video"}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Title</label>
            <input
              className="input mt-1"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Video title"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && createVideoOnDate()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Channel</label>
              <select className="input mt-1" value={newChannel} onChange={(e) => setNewChannel(e.target.value as ChannelId)}>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input mt-1" value={newPriority} onChange={(e) => setNewPriority(e.target.value as Priority)}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setNewDate(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={createVideoOnDate} disabled={!newTitle.trim()}>
              Create video
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

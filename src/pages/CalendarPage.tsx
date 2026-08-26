import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store";
import { CHANNEL_MAP } from "../data/channels";
import { PageHeader } from "../components/layout";
import { StageBadge } from "../components/common";
import { cx, monthLabel, todayIso } from "../lib/utils";
import { Video } from "../types";

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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
  const updateVideo = useStore((s) => s.updateVideo);
  const [mode, setMode] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState(new Date());
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

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
    if (videoId) updateVideo(videoId, { targetPublishDate: iso });
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
        className={cx(
          "flex min-h-[110px] flex-col gap-1 rounded-lg border p-1.5",
          muted ? "border-base-800 bg-base-900/30" : "border-base-700/50 bg-base-900/60",
          dragOverDay === iso && "border-accent bg-accent/10"
        )}
      >
        <div className={cx("text-xs", isToday ? "font-bold text-accent-soft" : muted ? "text-base-600" : "text-base-400")}>
          {date.getDate()}
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {items.map((v) => {
            const channel = CHANNEL_MAP[v.channelId];
            return (
              <div
                key={v.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", v.id)}
                onClick={() => navigate(`/video/${v.id}`)}
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
        Tip: drag any video card onto a different day to change its target publish date. Click a video to open its workspace.
      </div>
    </div>
  );
}

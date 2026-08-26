import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { useStore, ALL_CHANNELS } from "../store/store";
import { getChannel } from "../data/channels";
import { PageHeader } from "../components/layout";
import { PriorityDot } from "../components/common";
import { STAGE_LABELS, STAGES, ChannelId, Video } from "../types";
import { formatShortDate } from "../lib/utils";
import { cx } from "../lib/utils";
import { channelTextColor } from "../lib/color";

function VideoCard({ video, index, onClick }: { video: Video; index: number; onClick: () => void }) {
  const channel = getChannel(video.channelId);
  const theme = useStore((s) => s.settings.theme);
  return (
    <Draggable draggableId={video.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cx(
            "mb-2 cursor-pointer rounded-lg border border-base-700/60 bg-base-900 p-3 shadow-card transition-shadow hover:border-base-500",
            snapshot.isDragging && "ring-2 ring-accent"
          )}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span
              className="truncate rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ color: channelTextColor(channel.color, theme), backgroundColor: `${channel.color}1a` }}
            >
              {channel.name}
            </span>
            <PriorityDot priority={video.priority} />
          </div>
          <div className="text-sm font-medium leading-snug text-base-100 line-clamp-2">{video.title}</div>
          <div className="mt-1.5 truncate text-xs text-base-400">{video.nextAction}</div>
          <div className="mt-2 text-[11px] text-base-500">{formatShortDate(video.targetPublishDate)}</div>
        </div>
      )}
    </Draggable>
  );
}

export default function Pipeline() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const moveVideoStage = useStore((s) => s.moveVideoStage);
  const [channelFilter, setChannelFilter] = useState<ChannelId | "all">("all");

  const filtered = useMemo(
    () => (channelFilter === "all" ? videos : videos.filter((v) => v.channelId === channelFilter)),
    [videos, channelFilter]
  );

  const byStage = useMemo(() => {
    const map: Record<string, Video[]> = {};
    for (const stage of STAGES) map[stage] = [];
    // A stage that isn't one of the current STAGES (imported JSON, an old
    // removed stage name) has no column to land in — bucket it under "idea"
    // instead of crashing the board, so the video stays visible and the
    // user can just re-drag it to the right column.
    for (const v of filtered) (map[v.stage] ?? map.idea).push(v);
    return map;
  }, [filtered]);

  function onDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStage = destination.droppableId as (typeof STAGES)[number];
    moveVideoStage(draggableId, newStage);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Pipeline" subtitle="Drag a video between stages to move it forward." />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setChannelFilter("all")}
          className={
            channelFilter === "all"
              ? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
              : "rounded-full bg-base-800 px-3 py-1 text-xs font-medium text-base-300 hover:bg-base-700"
          }
        >
          All channels
        </button>
        {ALL_CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannelFilter(c.id)}
            className={cx(
              "rounded-full px-3 py-1 text-xs font-medium",
              channelFilter === c.id ? "text-white" : "bg-base-800 text-base-300 hover:bg-base-700"
            )}
            style={channelFilter === c.id ? { backgroundColor: c.color } : undefined}
          >
            {c.name}
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {STAGES.map((stage) => (
            <Droppable droppableId={stage} key={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cx(
                    "flex w-64 shrink-0 flex-col self-start rounded-xl border border-base-700/50 bg-base-900/40 p-2",
                    snapshot.isDraggingOver && "bg-accent/5 border-accent/40"
                  )}
                >
                  <div className="flex items-center justify-between px-1.5 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-base-300">
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="rounded-full bg-base-800 px-1.5 py-0.5 text-[10px] text-base-400">
                      {byStage[stage].length}
                    </span>
                  </div>
                  <div className="min-h-[60px]">
                    {byStage[stage].map((v, i) => (
                      <VideoCard key={v.id} video={v} index={i} onClick={() => navigate(`/video/${v.id}`)} />
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store";
import { useUIStore, toast } from "../store/uiStore";
import { Modal } from "./common";
import { ChannelId, Priority } from "../types";
import { cx } from "../lib/utils";

type Kind = "video" | "idea";

export function QuickAdd() {
  const open = useUIStore((s) => s.quickAddOpen);
  const close = useUIStore((s) => s.closeQuickAdd);
  const navigate = useNavigate();
  const addVideo = useStore((s) => s.addVideo);
  const addIdea = useStore((s) => s.addIdea);
  const channels = useStore((s) => s.channels);
  const defaultChannelId = useStore((s) => s.settings.defaultChannelId);

  const [kind, setKind] = useState<Kind>("idea");
  const [channelId, setChannelId] = useState<ChannelId>(defaultChannelId);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  function reset() {
    setTitle("");
    setKind("idea");
    setPriority("medium");
  }

  function handleClose() {
    reset();
    close();
  }

  function handleSubmit() {
    if (!title.trim()) return;
    if (kind === "video") {
      const v = addVideo({
        channelId,
        title: title.trim(),
        priority,
        nextAction: "Kick off research for this video",
        nextActionMinutes: 30,
      });
      toast(`Video created: "${v.title}"`, "success");
      handleClose();
      navigate(`/video/${v.id}`);
    } else {
      addIdea({
        channelId,
        topic: title.trim(),
        proposedTitle: title.trim(),
        hook: "",
        angle: "",
        priority,
        status: "new",
        ctrScore: 6.5,
        retentionScore: 6.5,
      });
      toast(`Idea added: "${title.trim()}"`, "success");
      handleClose();
      navigate("/ideas");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Quick add">
      <div className="flex flex-col gap-3">
        <div className="flex rounded-lg border border-base-600 p-0.5">
          <button
            onClick={() => setKind("idea")}
            className={cx("flex-1 rounded-md px-3 py-1.5 text-xs font-medium", kind === "idea" ? "bg-accent text-white" : "text-base-300")}
          >
            Idea
          </button>
          <button
            onClick={() => setKind("video")}
            className={cx("flex-1 rounded-md px-3 py-1.5 text-xs font-medium", kind === "video" ? "bg-accent text-white" : "text-base-300")}
          >
            Video
          </button>
        </div>

        <div>
          <label className="label">Channel</label>
          <select className="input mt-1" value={channelId} onChange={(e) => setChannelId(e.target.value as ChannelId)}>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{kind === "video" ? "Title" : "Proposed title"}</label>
          <input
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === "video" ? "Video title" : "What's the idea?"}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div>
          <label className="label">Priority</label>
          <select className="input mt-1" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!title.trim()}>
            {kind === "video" ? "Create video" : "Add idea"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

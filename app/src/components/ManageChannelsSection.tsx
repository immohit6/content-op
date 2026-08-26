import React, { useState } from "react";
import { useStore } from "../store/store";
import { Modal, Section } from "./common";
import { ChannelDef, ChannelId } from "../types";
import { toast } from "../store/uiStore";

interface Draft {
  name: string;
  tagline: string;
  niche: string;
  voice: string;
  color: string;
  publishFrequencyPerWeek: number;
}

const EMPTY_DRAFT: Draft = { name: "", tagline: "", niche: "", voice: "", color: "#5B8CFF", publishFrequencyPerWeek: 1 };

function toDraft(c: ChannelDef): Draft {
  return {
    name: c.name,
    tagline: c.tagline,
    niche: c.niche.join(", "),
    voice: c.voice,
    color: c.color,
    publishFrequencyPerWeek: c.publishFrequencyPerWeek,
  };
}

export function ManageChannelsSection() {
  const channels = useStore((s) => s.channels);
  const videos = useStore((s) => s.videos);
  const ideas = useStore((s) => s.ideas);
  const addChannel = useStore((s) => s.addChannel);
  const updateChannel = useStore((s) => s.updateChannel);
  const deleteChannel = useStore((s) => s.deleteChannel);

  const [editingId, setEditingId] = useState<ChannelId | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  function openNew() {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
  }

  function openEdit(c: ChannelDef) {
    setDraft(toDraft(c));
    setEditingId(c.id);
  }

  function close() {
    setEditingId(null);
  }

  function save() {
    if (!draft.name.trim()) return;
    const patch = {
      name: draft.name.trim(),
      tagline: draft.tagline.trim(),
      niche: draft.niche.split(",").map((n) => n.trim()).filter(Boolean),
      voice: draft.voice.trim(),
      color: draft.color,
      publishFrequencyPerWeek: Math.max(1, Math.round(draft.publishFrequencyPerWeek) || 1),
    };
    if (editingId === "new") {
      const c = addChannel(patch);
      toast(`Channel added: "${c.name}"`, "success");
    } else if (editingId) {
      updateChannel(editingId, patch);
      toast(`Channel updated: "${patch.name}"`, "success");
    }
    close();
  }

  function handleDelete(c: ChannelDef) {
    const videosAffected = videos.filter((v) => v.channelId === c.id).length;
    const ideasAffected = ideas.filter((i) => i.channelId === c.id).length;
    const affectedNote =
      videosAffected + ideasAffected > 0
        ? ` It has ${videosAffected} video${videosAffected === 1 ? "" : "s"} and ${ideasAffected} idea${ideasAffected === 1 ? "" : "s"} linked — they won't be deleted, but will show as "Unknown channel" until you point them elsewhere.`
        : "";
    if (!confirm(`Delete "${c.name}"?${affectedNote}`)) return;
    const result = deleteChannel(c.id);
    if (!result) {
      toast("You need at least one channel — can't delete the last one.", "error");
      return;
    }
    toast(`Channel deleted: "${c.name}"`, "success");
  }

  return (
    <Section
      title="Channels"
      action={
        <button className="btn-secondary" onClick={openNew}>
          + Add channel
        </button>
      }
    >
      <div className="card flex flex-col divide-y divide-base-700/60">
        {channels.map((c) => {
          const videoCount = videos.filter((v) => v.channelId === c.id).length;
          return (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-base-100">{c.name}</div>
                  <div className="truncate text-xs text-base-400">
                    {c.tagline || "No tagline"} · {videoCount} video{videoCount === 1 ? "" : "s"} · {c.publishFrequencyPerWeek}/wk
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="btn-secondary" onClick={() => openEdit(c)}>
                  Edit
                </button>
                <button className="btn-ghost !text-red-400" onClick={() => handleDelete(c)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={editingId !== null} onClose={close} title={editingId === "new" ? "Add channel" : "Edit channel"}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Name</label>
            <input className="input mt-1" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Channel name" autoFocus />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input mt-1" value={draft.tagline} onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))} placeholder="One-line description" />
          </div>
          <div>
            <label className="label">Niche (comma-separated)</label>
            <input className="input mt-1" value={draft.niche} onChange={(e) => setDraft((d) => ({ ...d, niche: e.target.value }))} placeholder="e.g. Cooking, Recipes, Home chef" />
          </div>
          <div>
            <label className="label">Voice / tone (used to steer AI generation for this channel)</label>
            <textarea
              className="input mt-1 min-h-[70px]"
              value={draft.voice}
              onChange={(e) => setDraft((d) => ({ ...d, voice: e.target.value }))}
              placeholder="How this channel sounds — tone, pacing, point of view…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" className="h-9 w-12 cursor-pointer rounded border border-base-600 bg-transparent" value={draft.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} />
                <input className="input flex-1" value={draft.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Publish frequency (videos / week)</label>
              <input
                type="number"
                min={1}
                max={7}
                className="input mt-1"
                value={draft.publishFrequencyPerWeek}
                onChange={(e) => setDraft((d) => ({ ...d, publishFrequencyPerWeek: Number(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button className="btn-secondary" onClick={close}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!draft.name.trim()}>
              {editingId === "new" ? "Add channel" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
    </Section>
  );
}

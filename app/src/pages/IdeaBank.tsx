import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, ALL_CHANNELS } from "../store/store";
import { CHANNEL_MAP } from "../data/channels";
import { PageHeader } from "../components/layout";
import { ChannelPill, CostHint, EmptyState, Modal, PriorityBadge, ScoreBadge } from "../components/common";
import { ChannelId, Idea, IdeaStatus, Priority } from "../types";
import { formatShortDate, todayIso } from "../lib/utils";
import { generateIdeas, estimateIdeasCost } from "../services/ideaService";
import { toast } from "../store/uiStore";
import { formatUSD } from "../lib/pricing";
import { useAIBudgetGuard } from "../lib/useAIBudgetGuard";

type SortKey = "newest" | "ctr" | "retention" | "combined";

const STATUS_LABEL: Record<IdeaStatus, string> = {
  new: "New",
  shortlisted: "Shortlisted",
  "in-production": "In production",
  archived: "Archived",
};

export default function IdeaBank() {
  const navigate = useNavigate();
  const ideas = useStore((s) => s.ideas);
  const addIdea = useStore((s) => s.addIdea);
  const addIdeasBulk = useStore((s) => s.addIdeasBulk);
  const updateIdea = useStore((s) => s.updateIdea);
  const deleteIdea = useStore((s) => s.deleteIdea);
  const promoteIdeaToVideo = useStore((s) => s.promoteIdeaToVideo);
  const defaultChannelId = useStore((s) => s.settings.defaultChannelId);
  const { confirmSpend, logSpend, aiSettings } = useAIBudgetGuard();

  const [channelFilter, setChannelFilter] = useState<ChannelId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("combined");

  const [showGenerate, setShowGenerate] = useState(false);
  const [genChannel, setGenChannel] = useState<ChannelId>(defaultChannelId);
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    channelId: defaultChannelId,
    topic: "",
    proposedTitle: "",
    hook: "",
    angle: "",
    priority: "medium" as Priority,
  });

  const filtered = useMemo(() => {
    let list = ideas;
    if (channelFilter !== "all") list = list.filter((i) => i.channelId === channelFilter);
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "newest") return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      if (sortKey === "ctr") return b.ctrScore - a.ctrScore;
      if (sortKey === "retention") return b.retentionScore - a.retentionScore;
      return b.ctrScore + b.retentionScore - (a.ctrScore + a.retentionScore);
    });
    return sorted;
  }, [ideas, channelFilter, statusFilter, sortKey]);

  async function handleGenerate() {
    const est = estimateIdeasCost(genChannel, genCount, aiSettings);
    if (!confirmSpend(est, "Generate Ideas")) return;
    setGenerating(true);
    try {
      const newIdeas = await generateIdeas(genChannel, genCount, aiSettings);
      addIdeasBulk(newIdeas);
      setShowGenerate(false);
      logSpend("Ideas", est);
      toast(`${newIdeas.length} ideas added for ${CHANNEL_MAP[genChannel].name}${est > 0 ? ` · ~${formatUSD(est)}` : ""}`, "success");
    } finally {
      setGenerating(false);
    }
  }

  function handleAdd() {
    if (!form.proposedTitle.trim()) return;
    addIdea({
      channelId: form.channelId,
      topic: form.topic || form.proposedTitle,
      proposedTitle: form.proposedTitle,
      hook: form.hook,
      angle: form.angle,
      priority: form.priority,
      status: "new",
      ctrScore: 6.5,
      retentionScore: 6.5,
    });
    setShowAdd(false);
    setForm({ channelId: defaultChannelId, topic: "", proposedTitle: "", hook: "", angle: "", priority: "medium" });
    toast(`Idea added: "${form.proposedTitle}"`, "success");
  }

  function handlePromote(idea: Idea) {
    const v = promoteIdeaToVideo(idea.id);
    if (v) {
      toast(`Promoted to video: "${v.title}"`, "success");
      navigate(`/video/${v.id}`);
    }
  }

  function handleDelete(idea: Idea) {
    deleteIdea(idea.id);
    toast(`Idea deleted`);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Idea Bank"
        subtitle="Every idea for every channel, scored and ready to promote to production."
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowAdd(true)}>
              + Add idea
            </button>
            <button className="btn-primary" onClick={() => setShowGenerate(true)}>
              ✨ Generate Ideas
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select className="input !w-auto" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as any)}>
          <option value="all">All channels</option>
          {ALL_CHANNELS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <select className="input !w-auto" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="combined">Sort: Best overall</option>
          <option value="ctr">Sort: CTR score</option>
          <option value="retention">Sort: Retention score</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No ideas match this view" action={<button className="btn-primary" onClick={() => setShowGenerate(true)}>✨ Generate Ideas</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((idea) => {
            const channel = CHANNEL_MAP[idea.channelId];
            return (
              <div key={idea.id} className="card flex flex-col gap-2.5 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <ChannelPill channel={channel} />
                  <PriorityBadge priority={idea.priority} />
                </div>
                <div className="text-sm font-semibold text-base-100">{idea.proposedTitle}</div>
                <p className="text-xs text-base-400">{idea.hook}</p>
                <p className="text-xs text-base-500">{idea.angle}</p>
                <div className="flex items-center gap-3">
                  <ScoreBadge label="CTR" value={idea.ctrScore} />
                  <ScoreBadge label="Retention" value={idea.retentionScore} />
                </div>
                <div className="flex items-center justify-between border-t border-base-700/60 pt-2.5">
                  <select
                    className="rounded-md border border-base-600 bg-base-850 px-1.5 py-1 text-xs text-base-300"
                    value={idea.status}
                    onChange={(e) => updateIdea(idea.id, { status: e.target.value as IdeaStatus })}
                  >
                    {Object.entries(STATUS_LABEL).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost !px-2 !py-1 text-[11px]" onClick={() => handleDelete(idea)}>
                      Delete
                    </button>
                    <button
                      className="btn-secondary !px-2 !py-1 text-[11px]"
                      onClick={() => handlePromote(idea)}
                      disabled={idea.status === "in-production"}
                    >
                      → Promote to video
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-base-500">Added {formatShortDate(idea.dateAdded)}</div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Ideas">
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Channel</label>
            <select className="input mt-1" value={genChannel} onChange={(e) => setGenChannel(e.target.value as ChannelId)}>
              {ALL_CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">How many ideas</label>
            <input
              type="number"
              min={1}
              max={10}
              className="input mt-1"
              value={genCount}
              onChange={(e) => setGenCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            />
          </div>
          <p className="text-xs text-base-400">
            Ideas are generated specifically for {CHANNEL_MAP[genChannel].name}'s niche — {CHANNEL_MAP[genChannel].niche.join(", ")}.
          </p>
          <div className="mt-2 flex items-center justify-end gap-2">
            <CostHint costUSD={estimateIdeasCost(genChannel, genCount, aiSettings)} />
            <button className="btn-secondary" onClick={() => setShowGenerate(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add idea">
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Channel</label>
            <select
              className="input mt-1"
              value={form.channelId}
              onChange={(e) => setForm({ ...form, channelId: e.target.value as ChannelId })}
            >
              {ALL_CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Proposed title</label>
            <input
              className="input mt-1"
              value={form.proposedTitle}
              onChange={(e) => setForm({ ...form, proposedTitle: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Hook</label>
            <textarea className="input mt-1 min-h-[60px]" value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} />
          </div>
          <div>
            <label className="label">Content angle</label>
            <textarea className="input mt-1 min-h-[60px]" value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input mt-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAdd} disabled={!form.proposedTitle.trim()}>
              Add idea
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

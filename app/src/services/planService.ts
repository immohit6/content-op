import { getChannel } from "../store/store";
import { DailyPlan, DailyPlanItem, Video } from "../types";
import { priorityRank } from "../store/store";
import { todayIso, uid } from "../lib/utils";

/**
 * Builds today's work plan from unfinished videos. This is a deterministic
 * heuristic (not an LLM call) so the page is always instantly useful, with
 * or without an AI provider configured.
 */
export function buildDailyPlan(videos: Video[]): DailyPlan {
  const actionable = videos.filter((v) => v.stage !== "published" && v.stage !== "analytics");

  const sorted = [...actionable].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    return new Date(a.targetPublishDate).getTime() - new Date(b.targetPublishDate).getTime();
  });

  const items: DailyPlanItem[] = sorted.slice(0, 6).map((v) => {
    const channel = getChannel(v.channelId);
    return {
      id: uid("plan"),
      videoId: v.id,
      label: `${v.nextAction} — ${channel.name}: "${v.title}"`,
      minutes: v.nextActionMinutes || 30,
      done: false,
    };
  });

  return { date: todayIso(), items, generatedAt: new Date().toISOString() };
}

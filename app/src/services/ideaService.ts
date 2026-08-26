import { getChannel } from "../store/store";
import { AISettings, ChannelDef, ChannelId, Idea } from "../types";
import { buildMockIdeas } from "./ai/mockGen";
import { withAI } from "./ai/provider";
import { todayIso, uid } from "../lib/utils";
import { EXPECTED_OUTPUT_TOKENS, estimateCostUSD } from "../lib/pricing";

const SYSTEM = `You generate YouTube video ideas tailored precisely to a channel's niche and voice — never generic ideas. Respond ONLY with a JSON array matching this TypeScript type:
{ topic: string, proposedTitle: string, hook: string, angle: string, priority: "urgent"|"high"|"medium"|"low", ctrScore: number, retentionScore: number }[]`;

function buildPrompt(channel: ChannelDef, count: number): string {
  return `Channel: ${channel.name}.\nNiche: ${channel.niche.join(", ")}.\nVoice: ${channel.voice}\nGenerate ${count} fresh video ideas specific to this channel's exact niche. Avoid generic ideas that could apply to any channel.`;
}

export async function generateIdeas(channelId: ChannelId, count: number, settings: AISettings): Promise<Idea[]> {
  const channel = getChannel(channelId);
  const mock = () => buildMockIdeas(channel, count);
  const prompt = buildPrompt(channel, count);
  const results = await withAI(settings, SYSTEM, prompt, mock);
  return results.map((r) => ({
    ...r,
    id: uid("idea"),
    dateAdded: todayIso(),
  }));
}

export function estimateIdeasCost(channelId: ChannelId, count: number, settings: AISettings): number {
  const channel = getChannel(channelId);
  const prompt = SYSTEM + buildPrompt(channel, count);
  return estimateCostUSD(settings.provider, settings.model, prompt, EXPECTED_OUTPUT_TOKENS.ideaEach * count);
}

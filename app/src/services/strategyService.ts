import { ChannelDef, AISettings, Idea, StrategyRecommendation, Video } from "../types";
import { buildMockStrategy } from "./ai/mockGen";
import { withAI } from "./ai/provider";
import { EXPECTED_OUTPUT_TOKENS, estimateCostUSD } from "../lib/pricing";

const SYSTEM = `You are a YouTube content strategist analyzing a creator's full content database across multiple channels. Respond ONLY with a JSON array matching this TypeScript type:
{ channelId: string, title: string, reason: string, angle: string, estCtr: number, estRetention: number }[] (exactly 5)`;

function buildSummary(channels: ChannelDef[], videos: Video[], ideas: Idea[]) {
  return channels.map((c) => ({
    channel: c.name,
    id: c.id,
    cadencePerWeek: c.publishFrequencyPerWeek,
    activeVideos: videos.filter((v) => v.channelId === c.id && v.stage !== "published" && v.stage !== "analytics").length,
    publishedRecently: videos.filter((v) => v.channelId === c.id && (v.stage === "published" || v.stage === "analytics")).length,
    unusedIdeas: ideas.filter((i) => i.channelId === c.id && i.status === "new").length,
  }));
}

function buildPrompt(channels: ChannelDef[], videos: Video[], ideas: Idea[]): string {
  const summary = buildSummary(channels, videos, ideas);
  return `Here is the current state of my 5 YouTube channels: ${JSON.stringify(summary)}.\nRecommend the next 5 videos I should make across these channels, considering channel balance, content gaps, variety, and potential performance. Explain "why this video" for each.`;
}

export async function recommendNextVideos(
  channels: ChannelDef[],
  videos: Video[],
  ideas: Idea[],
  settings: AISettings
): Promise<StrategyRecommendation[]> {
  const mock = () => buildMockStrategy(channels, videos, ideas);
  const prompt = buildPrompt(channels, videos, ideas);
  return withAI(settings, SYSTEM, prompt, mock);
}

export function estimateStrategyCost(channels: ChannelDef[], videos: Video[], ideas: Idea[], settings: AISettings): number {
  const prompt = SYSTEM + buildPrompt(channels, videos, ideas);
  return estimateCostUSD(settings.provider, settings.model, prompt, EXPECTED_OUTPUT_TOKENS.strategy);
}

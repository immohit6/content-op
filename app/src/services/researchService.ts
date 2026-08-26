import { CHANNEL_MAP } from "../data/channels";
import { AISettings, ChannelDef, ResearchData, Video } from "../types";
import { buildMockResearch } from "./ai/mockGen";
import { withAI } from "./ai/provider";
import { EXPECTED_OUTPUT_TOKENS, estimateCostUSD } from "../lib/pricing";

const SYSTEM = `You are a research assistant for a YouTube creator. Respond ONLY with a JSON object matching this TypeScript type:
{ keyFacts: string[], context: string[], angles: string[], contrarianViewpoints: string[], storyOpportunities: string[], sources: string[], factCheckNeeded: string[], notes: string }`;

function buildPrompt(video: Video, channel: ChannelDef): string {
  return `Channel: ${channel.name} (${channel.niche.join(", ")}).\nChannel voice: ${channel.voice}\nVideo title: "${video.title}"\nProduce deep research for this video: key facts, important context, interesting angles, contrarian viewpoints, story opportunities, sources, and things that need fact-checking. Be specific to this exact topic, not generic.`;
}

export async function generateResearch(video: Video, settings: AISettings): Promise<ResearchData> {
  const channel = CHANNEL_MAP[video.channelId];
  const mock = () => buildMockResearch(video, channel);
  const prompt = buildPrompt(video, channel);
  const result = await withAI(settings, SYSTEM, prompt, mock);
  return { ...result, generatedAt: new Date().toISOString() };
}

/** Rough pre-flight cost estimate for a real (non-mock) provider call. Returns 0 for demo mode. */
export function estimateResearchCost(video: Video, settings: AISettings): number {
  const channel = CHANNEL_MAP[video.channelId];
  const prompt = SYSTEM + buildPrompt(video, channel);
  return estimateCostUSD(settings.provider, settings.model, prompt, EXPECTED_OUTPUT_TOKENS.research);
}

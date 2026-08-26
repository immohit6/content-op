import { getChannel } from "../store/store";
import { AISettings, ChannelDef, PackagingData, Video } from "../types";
import { buildMockPackaging } from "./ai/mockGen";
import { withAI } from "./ai/provider";
import { EXPECTED_OUTPUT_TOKENS, estimateCostUSD } from "../lib/pricing";

const SYSTEM = `You are a YouTube packaging expert (titles, thumbnails, SEO). Respond ONLY with a JSON object matching this TypeScript type:
{ titles: {title: string, ctrScore: number}[] (exactly 10), recommendedTitleIndex: number, thumbnailConcept: string, thumbnailText: string, description: string, tags: string[], chapters: {time: string, label: string}[], pinnedComment: string }`;

function buildPrompt(video: Video, channel: ChannelDef): string {
  const script = video.script ? `\nScript summary: ${video.script.opening}` : "";
  return `Channel: ${channel.name} (${channel.niche.join(", ")}).\nVideo title: "${video.title}"${script}\nGenerate 10 title options each with a CTR score (0-10), pick the best one, a thumbnail concept, thumbnail text (short), a YouTube description, tags, timestamped chapters, and a pinned comment to drive engagement.`;
}

export async function generatePackaging(video: Video, settings: AISettings): Promise<PackagingData> {
  const channel = getChannel(video.channelId);
  const mock = () => buildMockPackaging(video, channel);
  const prompt = buildPrompt(video, channel);
  const result = await withAI(settings, SYSTEM, prompt, mock);
  return { ...result, generatedAt: new Date().toISOString() };
}

export function estimatePackagingCost(video: Video, settings: AISettings): number {
  const channel = getChannel(video.channelId);
  const prompt = SYSTEM + buildPrompt(video, channel);
  return estimateCostUSD(settings.provider, settings.model, prompt, EXPECTED_OUTPUT_TOKENS.packaging);
}

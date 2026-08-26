import { CHANNEL_MAP } from "../data/channels";
import { AISettings, PackagingData, Video } from "../types";
import { buildMockPackaging } from "./ai/mockGen";
import { withAI } from "./ai/provider";

const SYSTEM = `You are a YouTube packaging expert (titles, thumbnails, SEO). Respond ONLY with a JSON object matching this TypeScript type:
{ titles: {title: string, ctrScore: number}[] (exactly 10), recommendedTitleIndex: number, thumbnailConcept: string, thumbnailText: string, description: string, tags: string[], chapters: {time: string, label: string}[], pinnedComment: string }`;

export async function generatePackaging(video: Video, settings: AISettings): Promise<PackagingData> {
  const channel = CHANNEL_MAP[video.channelId];
  const mock = () => buildMockPackaging(video, channel);
  const script = video.script ? `\nScript summary: ${video.script.opening}` : "";
  const prompt = `Channel: ${channel.name} (${channel.niche.join(", ")}).\nVideo title: "${video.title}"${script}\nGenerate 10 title options each with a CTR score (0-10), pick the best one, a thumbnail concept, thumbnail text (short), a YouTube description, tags, timestamped chapters, and a pinned comment to drive engagement.`;
  const result = await withAI(settings, SYSTEM, prompt, mock);
  return { ...result, generatedAt: new Date().toISOString() };
}

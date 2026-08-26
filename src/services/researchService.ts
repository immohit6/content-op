import { CHANNEL_MAP } from "../data/channels";
import { AISettings, ResearchData, Video } from "../types";
import { buildMockResearch } from "./ai/mockGen";
import { withAI } from "./ai/provider";

const SYSTEM = `You are a research assistant for a YouTube creator. Respond ONLY with a JSON object matching this TypeScript type:
{ keyFacts: string[], context: string[], angles: string[], contrarianViewpoints: string[], storyOpportunities: string[], sources: string[], factCheckNeeded: string[], notes: string }`;

export async function generateResearch(video: Video, settings: AISettings): Promise<ResearchData> {
  const channel = CHANNEL_MAP[video.channelId];
  const mock = () => buildMockResearch(video, channel);
  const prompt = `Channel: ${channel.name} (${channel.niche.join(", ")}).\nChannel voice: ${channel.voice}\nVideo title: "${video.title}"\nProduce deep research for this video: key facts, important context, interesting angles, contrarian viewpoints, story opportunities, sources, and things that need fact-checking. Be specific to this exact topic, not generic.`;
  const result = await withAI(settings, SYSTEM, prompt, mock);
  return { ...result, generatedAt: new Date().toISOString() };
}

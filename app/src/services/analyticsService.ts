import { CHANNEL_MAP } from "../data/channels";
import { AIAnalysis, AISettings, Video } from "../types";
import { buildMockAnalysis } from "./ai/mockGen";
import { withAI } from "./ai/provider";

const SYSTEM = `You are a YouTube performance analyst. Give specific, actionable conclusions from the metrics provided, never generic motivational advice. Respond ONLY with a JSON object matching this TypeScript type:
{ whatWorked: string, whatDidnt: string, why: string, repeat: string, stop: string, nextTest: string }`;

export async function analyzePerformance(video: Video, settings: AISettings): Promise<AIAnalysis> {
  const channel = CHANNEL_MAP[video.channelId];
  const mock = () => buildMockAnalysis(video, channel);
  const prompt = `Channel: ${channel.name}.\nVideo: "${video.title}"\nMetrics: ${JSON.stringify(video.metrics ?? {})}\nAnalyze what worked, what didn't, why, what to repeat, what to stop doing, and what the next video should test. Be concrete — reference the actual numbers, e.g. "Your CTR is strong but retention drops sharply in the first 30 seconds."`;
  const result = await withAI(settings, SYSTEM, prompt, mock);
  return { ...result, generatedAt: new Date().toISOString() };
}

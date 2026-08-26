import { CHANNEL_MAP } from "../data/channels";
import { AIAnalysis, AISettings, ChannelDef, Video } from "../types";
import { buildMockAnalysis } from "./ai/mockGen";
import { withAI } from "./ai/provider";
import { EXPECTED_OUTPUT_TOKENS, estimateCostUSD } from "../lib/pricing";

const SYSTEM = `You are a YouTube performance analyst. Give specific, actionable conclusions from the metrics provided, never generic motivational advice. Respond ONLY with a JSON object matching this TypeScript type:
{ whatWorked: string, whatDidnt: string, why: string, repeat: string, stop: string, nextTest: string }`;

function buildPrompt(video: Video, channel: ChannelDef): string {
  return `Channel: ${channel.name}.\nVideo: "${video.title}"\nMetrics: ${JSON.stringify(video.metrics ?? {})}\nAnalyze what worked, what didn't, why, what to repeat, what to stop doing, and what the next video should test. Be concrete — reference the actual numbers, e.g. "Your CTR is strong but retention drops sharply in the first 30 seconds."`;
}

export async function analyzePerformance(video: Video, settings: AISettings): Promise<AIAnalysis> {
  const channel = CHANNEL_MAP[video.channelId];
  const mock = () => buildMockAnalysis(video, channel);
  const prompt = buildPrompt(video, channel);
  const result = await withAI(settings, SYSTEM, prompt, mock);
  return { ...result, generatedAt: new Date().toISOString() };
}

export function estimateAnalysisCost(video: Video, settings: AISettings): number {
  const channel = CHANNEL_MAP[video.channelId];
  const prompt = SYSTEM + buildPrompt(video, channel);
  return estimateCostUSD(settings.provider, settings.model, prompt, EXPECTED_OUTPUT_TOKENS.analysis);
}

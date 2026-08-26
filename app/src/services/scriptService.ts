import { CHANNEL_MAP } from "../data/channels";
import { AISettings, ChannelDef, ScriptData, Video } from "../types";
import { buildMockScript } from "./ai/mockGen";
import { withAI } from "./ai/provider";
import { EXPECTED_OUTPUT_TOKENS, estimateCostUSD } from "../lib/pricing";

const SYSTEM = `You are a YouTube scriptwriter who writes in a specific creator's voice, never robotic or generic AI-sounding copy. Respond ONLY with a JSON object matching this TypeScript type:
{ hooks: {text: string, angle: string, score: number}[] (exactly 5), recommendedHookIndex: number, opening: string, fullScript: string, retentionBeats: string[], patternInterrupts: string[], bRollSuggestions: string[], cta: string }`;

function buildPrompt(video: Video, channel: ChannelDef): string {
  const research = video.research ? `\nResearch to draw from: ${JSON.stringify(video.research)}` : "";
  return `Channel: ${channel.name}.\nChannel voice/style: ${channel.voice}\nVideo title: "${video.title}"${research}\nWrite: 5 distinct hooks with an angle label and a score (0-10), pick the best one, an opening, a full script with clear segments, retention beats mapped to timing/percent, pattern interrupts, b-roll suggestions, and a CTA. The script must sound human and match the channel's specific voice — not generic AI writing.`;
}

export async function generateScript(video: Video, settings: AISettings): Promise<ScriptData> {
  const channel = CHANNEL_MAP[video.channelId];
  const mock = () => buildMockScript(video, channel);
  const prompt = buildPrompt(video, channel);
  const result = await withAI(settings, SYSTEM, prompt, mock);
  return { ...result, generatedAt: new Date().toISOString() };
}

export function estimateScriptCost(video: Video, settings: AISettings): number {
  const channel = CHANNEL_MAP[video.channelId];
  const prompt = SYSTEM + buildPrompt(video, channel);
  return estimateCostUSD(settings.provider, settings.model, prompt, EXPECTED_OUTPUT_TOKENS.script);
}

import { ChannelDef, ChannelId } from "../types";

export const CHANNELS: ChannelDef[] = [
  {
    id: "world-explained",
    name: "The World Explained",
    tagline: "Geopolitics, world affairs & documentary explainers",
    niche: ["Geopolitics", "World affairs", "Documentary storytelling", "Explainers"],
    voice:
      "Calm, authoritative documentary narrator. Builds tension through context and stakes, not hype. Uses a clear narrative arc: setup, escalation, turning point, implication for the viewer's world.",
    color: "#5B8CFF",
    publishFrequencyPerWeek: 1,
  },
  {
    id: "ai-blueprint",
    name: "AI Blueprint",
    tagline: "AI tools, experiments & personal transformation",
    niche: ["AI", "AI experiments", "AI tools", "Personal transformation", "Can AI build a better life?"],
    voice:
      "Curious, first-person experimenter. Treats every video like a live test: hypothesis, attempt, honest result. Skeptical of hype, excited about what actually works.",
    color: "#7C5CFC",
    publishFrequencyPerWeek: 2,
  },
  {
    id: "unfiltered-uncut",
    name: "Unfiltered & Uncut",
    tagline: "Cinematic travel, walking videos & raw storytelling",
    niche: ["Travel", "Walking videos", "Personal experiences", "Cinematic travel", "Raw storytelling"],
    voice:
      "Intimate, personal, present-tense narration like a diary entry read aloud. Sensory detail over statistics. Comfortable with silence and unpolished honesty.",
    color: "#FF8A5B",
    publishFrequencyPerWeek: 1,
  },
  {
    id: "money-with-mo",
    name: "Money with Mo",
    tagline: "Personal finance, AU/IN money topics & side hustles",
    niche: ["Personal finance", "Money", "Australia/India finance", "Business", "Side hustles"],
    voice:
      "Practical, plain-English mentor. No jargon without explaining it. Every claim backed by a number or example. Speaks like a smart friend, not a bank ad.",
    color: "#3ED598",
    publishFrequencyPerWeek: 2,
  },
  {
    id: "hindi-lofi",
    name: "Hindi Lofi Songs",
    tagline: "Original Hindi songs, romantic & emotional lofi",
    niche: ["Original Hindi songs", "Romantic songs", "Emotional music", "Lofi"],
    voice:
      "Poetic, emotionally vulnerable songwriter voice. Focused on feeling and imagery over explanation. Lyrics and mood come first, everything else supports them.",
    color: "#F45D9E",
    publishFrequencyPerWeek: 1,
  },
];

export const CHANNEL_MAP: Record<ChannelId, ChannelDef> = CHANNELS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<ChannelId, ChannelDef>
);

const UNKNOWN_CHANNEL: ChannelDef = {
  id: "world-explained",
  name: "Unknown channel",
  tagline: "This video references a channel that no longer exists.",
  niche: [],
  voice: "",
  color: "#5B6576",
  publishFrequencyPerWeek: 1,
};

/**
 * Safe channel lookup — prefer this over indexing CHANNEL_MAP directly.
 * `channelId` is normally a compile-time-checked ChannelId everywhere in
 * this app's own code, but it can also come from imported JSON (no runtime
 * validation) or, indirectly, a slightly malformed real AI response. A
 * missing/renamed id there would make `CHANNEL_MAP[id]` return `undefined`
 * and crash every caller downstream (`.name`, `.color`, ...) instead of
 * just rendering a clearly-labeled placeholder.
 */
export function getChannel(channelId: string): ChannelDef {
  return CHANNEL_MAP[channelId as ChannelId] ?? UNKNOWN_CHANNEL;
}

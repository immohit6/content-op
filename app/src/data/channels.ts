import { ChannelDef } from "../types";

/** Initial seed content — the app's own channel list now lives in the store (user-editable), this is just the starting point for a fresh install. */
export const DEFAULT_CHANNELS: ChannelDef[] = [
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

/** Placeholder shown for a video/idea whose channel was deleted (or never existed — malformed import). */
export const UNKNOWN_CHANNEL: ChannelDef = {
  id: "__unknown__",
  name: "Unknown channel",
  tagline: "This item references a channel that no longer exists.",
  niche: [],
  voice: "",
  color: "#5B6576",
  publishFrequencyPerWeek: 1,
};

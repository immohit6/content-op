export type ChannelId = "world-explained" | "ai-blueprint" | "unfiltered-uncut" | "money-with-mo" | "hindi-lofi";

export interface ChannelDef {
  id: ChannelId;
  name: string;
  tagline: string;
  niche: string[];
  voice: string;
  color: string; // tailwind color token used for accents
  publishFrequencyPerWeek: number;
}

export const STAGES = [
  "idea",
  "research",
  "script",
  "record",
  "edit",
  "thumbnail",
  "seo",
  "scheduled",
  "published",
  "analytics",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  idea: "Idea",
  research: "Research",
  script: "Script",
  record: "Record",
  edit: "Edit",
  thumbnail: "Thumbnail",
  seo: "SEO",
  scheduled: "Scheduled",
  published: "Published",
  analytics: "Analytics",
};

export type Priority = "urgent" | "high" | "medium" | "low";

export const PRIORITY_META: Record<Priority, { label: string; dot: string; text: string }> = {
  urgent: { label: "Urgent", dot: "bg-red-500", text: "text-red-400" },
  high: { label: "High", dot: "bg-amber-400", text: "text-amber-300" },
  medium: { label: "Medium", dot: "bg-emerald-400", text: "text-emerald-300" },
  low: { label: "Low", dot: "bg-sky-400", text: "text-sky-300" },
};

export interface PerformanceMetrics {
  views?: number;
  ctr?: number; // percentage — manual entry only, not exposed by the public YouTube Data API
  avgViewDurationSec?: number; // manual entry only — requires YouTube Analytics API (OAuth)
  avgPercentViewed?: number; // percentage — manual entry only, same reason
  likes?: number;
  comments?: number;
  subscribersGained?: number; // manual entry only, same reason
  /** ISO timestamp of the last successful live sync from the YouTube Data API. Absent = never synced (manual only). */
  syncedAt?: string;
}

export interface ScriptHook {
  text: string;
  angle: string;
  score: number;
}

export interface ScriptData {
  hooks: ScriptHook[];
  recommendedHookIndex: number;
  opening: string;
  fullScript: string;
  retentionBeats: string[];
  patternInterrupts: string[];
  bRollSuggestions: string[];
  cta: string;
  generatedAt?: string;
}

export interface ResearchData {
  keyFacts: string[];
  context: string[];
  angles: string[];
  contrarianViewpoints: string[];
  storyOpportunities: string[];
  sources: string[];
  factCheckNeeded: string[];
  notes: string;
  generatedAt?: string;
}

export interface TitleOption {
  title: string;
  ctrScore: number;
}

export interface PackagingData {
  titles: TitleOption[];
  recommendedTitleIndex: number;
  thumbnailConcept: string;
  thumbnailText: string;
  description: string;
  tags: string[];
  chapters: { time: string; label: string }[];
  pinnedComment: string;
  generatedAt?: string;
}

export interface AIAnalysis {
  whatWorked: string;
  whatDidnt: string;
  why: string;
  repeat: string;
  stop: string;
  nextTest: string;
  generatedAt: string;
}

export interface Video {
  id: string;
  channelId: ChannelId;
  title: string;
  stage: Stage;
  priority: Priority;
  targetPublishDate: string; // ISO date
  nextAction: string;
  nextActionMinutes: number;
  thumbnailConcept: string;
  description: string;
  tags: string[];
  notes: string;
  videoUrl?: string;
  research: ResearchData | null;
  script: ScriptData | null;
  packaging: PackagingData | null;
  metrics: PerformanceMetrics | null;
  aiAnalysis: AIAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export type IdeaStatus = "new" | "shortlisted" | "in-production" | "archived";

export interface Idea {
  id: string;
  channelId: ChannelId;
  topic: string;
  proposedTitle: string;
  hook: string;
  angle: string;
  priority: Priority;
  status: IdeaStatus;
  dateAdded: string;
  ctrScore: number;
  retentionScore: number;
}

export type AIProviderKind = "mock" | "openai" | "anthropic";

export interface AISettings {
  provider: AIProviderKind;
  apiKey: string;
  model: string;
}

export interface YouTubeSettings {
  apiKey: string;
  /** Real YouTube channel ID/handle/URL linked to each app channel, so historical uploads can be listed. */
  channelIds?: Partial<Record<ChannelId, string>>;
}

export interface AppSettings {
  ai: AISettings;
  youtube: YouTubeSettings;
  defaultChannelId: ChannelId;
  defaultPublishFrequency: number;
  theme: "dark" | "light";
  budgetLimitUSD: number;
  dailyBudgetLimitUSD: number;
}

export interface SpendEntry {
  id: string;
  timestamp: string;
  feature: string;
  provider: AIProviderKind;
  model: string;
  estCostUSD: number;
}

export interface DailyPlanItem {
  id: string;
  videoId: string;
  label: string;
  minutes: number;
  done: boolean;
}

export interface DailyPlan {
  date: string; // ISO date, day the plan was generated for
  items: DailyPlanItem[];
  generatedAt: string;
}

export interface StrategyRecommendation {
  channelId: ChannelId;
  title: string;
  reason: string;
  angle: string;
  estCtr: number;
  estRetention: number;
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHANNELS } from "../data/channels";
import { buildSeedIdeas, buildSeedVideos } from "../data/seed";
import {
  AppSettings,
  ChannelId,
  DailyPlan,
  Idea,
  IdeaStatus,
  Priority,
  SpendEntry,
  Stage,
  Video,
} from "../types";
import { todayIso, uid } from "../lib/utils";

const DEFAULT_SETTINGS: AppSettings = {
  ai: { provider: "mock", apiKey: "", model: "" },
  youtube: { apiKey: "" },
  defaultChannelId: "world-explained",
  defaultPublishFrequency: 1,
  theme: "dark",
  budgetLimitUSD: 2.0,
  dailyBudgetLimitUSD: 1.0,
};

export interface StoreShape {
  videos: Video[];
  ideas: Idea[];
  settings: AppSettings;
  dailyPlan: DailyPlan | null;
  spend: { totalUSD: number; entries: SpendEntry[] };

  addVideo: (partial: Partial<Video> & { channelId: ChannelId; title: string }) => Video;
  updateVideo: (id: string, patch: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  moveVideoStage: (id: string, stage: Stage) => void;

  addIdea: (partial: Omit<Idea, "id" | "dateAdded"> & { dateAdded?: string }) => Idea;
  addIdeasBulk: (ideas: Idea[]) => void;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  setIdeaStatus: (id: string, status: IdeaStatus) => void;
  promoteIdeaToVideo: (id: string) => Video | null;

  updateSettings: (patch: Partial<AppSettings>) => void;

  recordSpend: (entry: Omit<SpendEntry, "id" | "timestamp">) => void;
  resetSpend: () => void;

  setDailyPlan: (plan: DailyPlan) => void;
  toggleDailyItem: (itemId: string) => void;

  exportData: () => { videos: Video[]; ideas: Idea[]; settings: AppSettings };
  importData: (data: { videos?: Video[]; ideas?: Idea[]; settings?: AppSettings }) => void;
  resetDemoData: () => void;
}

export const useStore = create<StoreShape>()(
  persist(
    (set, get) => ({
      videos: buildSeedVideos(),
      ideas: buildSeedIdeas(),
      settings: DEFAULT_SETTINGS,
      dailyPlan: null,
      spend: { totalUSD: 0, entries: [] },

      addVideo: (partial) => {
        const now = new Date().toISOString();
        const v: Video = {
          id: uid("vid"),
          stage: "idea",
          priority: "medium",
          targetPublishDate: now.slice(0, 10),
          nextAction: "Define the next step for this video",
          nextActionMinutes: 20,
          thumbnailConcept: "",
          description: "",
          tags: [],
          notes: "",
          research: null,
          script: null,
          packaging: null,
          metrics: null,
          aiAnalysis: null,
          createdAt: now,
          updatedAt: now,
          ...partial,
        };
        set((s) => ({ videos: [v, ...s.videos] }));
        return v;
      },

      updateVideo: (id, patch) => {
        set((s) => ({
          videos: s.videos.map((v) => (v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v)),
        }));
      },

      deleteVideo: (id) => {
        set((s) => ({ videos: s.videos.filter((v) => v.id !== id) }));
      },

      moveVideoStage: (id, stage) => {
        get().updateVideo(id, { stage });
      },

      addIdea: (partial) => {
        const i: Idea = { id: uid("idea"), dateAdded: todayIso(), ...partial };
        set((s) => ({ ideas: [i, ...s.ideas] }));
        return i;
      },

      addIdeasBulk: (ideas) => {
        set((s) => ({ ideas: [...ideas, ...s.ideas] }));
      },

      updateIdea: (id, patch) => {
        set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
      },

      deleteIdea: (id) => {
        set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) }));
      },

      setIdeaStatus: (id, status) => {
        get().updateIdea(id, { status });
      },

      promoteIdeaToVideo: (id) => {
        const idea = get().ideas.find((i) => i.id === id);
        if (!idea) return null;
        const v = get().addVideo({
          channelId: idea.channelId,
          title: idea.proposedTitle || idea.topic,
          stage: "idea",
          priority: idea.priority,
          nextAction: "Kick off research for this video",
          nextActionMinutes: 30,
          notes: `Hook: ${idea.hook}\nAngle: ${idea.angle}`,
        });
        get().setIdeaStatus(id, "in-production");
        return v;
      },

      updateSettings: (patch) => {
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            ai: { ...s.settings.ai, ...(patch.ai ?? {}) },
            youtube: { ...s.settings.youtube, ...(patch.youtube ?? {}) },
          },
        }));
      },

      recordSpend: (entry) => {
        set((s) => ({
          spend: {
            totalUSD: s.spend.totalUSD + entry.estCostUSD,
            entries: [{ ...entry, id: uid("spend"), timestamp: new Date().toISOString() }, ...s.spend.entries].slice(0, 200),
          },
        }));
      },

      resetSpend: () => set({ spend: { totalUSD: 0, entries: [] } }),

      setDailyPlan: (plan) => set({ dailyPlan: plan }),

      toggleDailyItem: (itemId) => {
        set((s) => {
          if (!s.dailyPlan) return s;
          return {
            dailyPlan: {
              ...s.dailyPlan,
              items: s.dailyPlan.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
            },
          };
        });
      },

      exportData: () => {
        const { videos, ideas, settings } = get();
        return {
          videos,
          ideas,
          settings: { ...settings, ai: { ...settings.ai, apiKey: "" }, youtube: { ...settings.youtube, apiKey: "" } },
        };
      },

      importData: (data) => {
        set((s) => ({
          videos: data.videos ?? s.videos,
          ideas: data.ideas ?? s.ideas,
          settings: data.settings ? { ...s.settings, ...data.settings } : s.settings,
        }));
      },

      resetDemoData: () => {
        set({ videos: buildSeedVideos(), ideas: buildSeedIdeas(), dailyPlan: null });
      },
    }),
    {
      name: "content-os-store",
      partialize: (s) => ({ videos: s.videos, ideas: s.ideas, settings: s.settings, dailyPlan: s.dailyPlan, spend: s.spend }),
    }
  )
);

export const ALL_CHANNELS = CHANNELS;

export function priorityRank(p: Priority): number {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[p];
}

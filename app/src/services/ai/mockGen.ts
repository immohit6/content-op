import { ChannelDef } from "../../types";
import {
  AIAnalysis,
  Idea,
  PackagingData,
  PerformanceMetrics,
  ResearchData,
  ScriptData,
  StrategyRecommendation,
  Video,
} from "../../types";
import { getFlavor } from "./flavor";
import { isoDaysFromNow, uid } from "../../lib/utils";

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function buildMockResearch(video: Video, channel: ChannelDef): ResearchData {
  const f = getFlavor(channel.id);
  const t = video.title;
  return {
    keyFacts: [
      `${t} sits at the intersection of ${(channel.niche[0] ?? "this channel's focus").toLowerCase()} and ${(channel.niche[1] ?? channel.niche[0] ?? "the audience's interests").toLowerCase()}.`,
      `The most recent reporting on this topic shifted meaningfully in the last 12 months — worth anchoring the video's timeliness there.`,
      `There is a specific, citable statistic available for this topic that will anchor the hook.`,
    ],
    context: f.contextThemes,
    angles: [`Frame ${t} through ${f.hookAngles[0]}`, `Consider a secondary angle: ${f.hookAngles[1]}`],
    contrarianViewpoints: f.contrarian(t),
    storyOpportunities: f.storyOps(t),
    sources: ["Primary reporting from a major outlet (verify before publish)", "At least one primary/original-source document", "A relevant data set or index"],
    factCheckNeeded: f.factCheck,
    notes: `Channel voice for this piece: ${channel.voice}`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildMockScript(video: Video, channel: ChannelDef): ScriptData {
  const f = getFlavor(channel.id);
  const t = video.title;
  const openers = f.openers(t);
  const hookTexts = pick(openers.concat(openers), 3);
  const hooks = f.hookAngles.slice(0, 5).map((angle, i) => ({
    text: hookTexts[i % hookTexts.length] ?? openers[0],
    angle,
    score: round1(6.8 + Math.random() * 2.6),
  }));
  const recommendedHookIndex = hooks.reduce((best, h, i, arr) => (h.score > arr[best].score ? i : best), 0);
  return {
    hooks,
    recommendedHookIndex,
    opening: hooks[recommendedHookIndex].text,
    fullScript: [
      `[COLD OPEN]\n${hooks[recommendedHookIndex].text}`,
      `[SEGMENT 1 — SETUP]\nEstablish ${t} and why it matters right now. Tone: ${f.scriptTone}.`,
      `[SEGMENT 2 — DEVELOPMENT]\nBuild through the core evidence/story beats. Use short sentences. Vary pacing.`,
      `[SEGMENT 3 — TURN]\nIntroduce the contrarian or unexpected angle: ${f.contrarian(t)[0]}`,
      `[SEGMENT 4 — RESOLUTION]\nLand the takeaway clearly. Don't over-explain — trust the audience.`,
      `[CTA + OUTRO]\n${f.ctas(t)[0]}`,
    ].join("\n\n"),
    retentionBeats: [
      "0:00-0:15 — hook must pay off within the first sentence, no logo intro",
      "25% mark — first pattern interrupt to reset attention",
      "50% mark — introduce the turn/contrarian angle here, this is the highest drop-off risk zone",
      "85% mark — emotional or informational peak right before the CTA",
    ],
    patternInterrupts: f.patternInterrupts,
    bRollSuggestions: f.bRoll(t),
    cta: f.ctas(t)[0],
    generatedAt: new Date().toISOString(),
  };
}

export function buildMockPackaging(video: Video, channel: ChannelDef): PackagingData {
  const f = getFlavor(channel.id);
  const t = video.title;
  const titleTexts = f.titleTemplates(t);
  const titles = titleTexts.map((title) => ({ title, ctrScore: round1(5.5 + Math.random() * 4) }));
  const recommendedTitleIndex = titles.reduce((best, ti, i, arr) => (ti.ctrScore > arr[best].ctrScore ? i : best), 0);
  const chapterCount = 4 + Math.floor(Math.random() * 3);
  const chapters = Array.from({ length: chapterCount }, (_, i) => ({
    time: `${String(Math.floor((i * 90) / 60)).padStart(2, "0")}:${String((i * 90) % 60).padStart(2, "0")}`,
    label: i === 0 ? "Intro" : i === chapterCount - 1 ? "Closing thoughts" : `Part ${i}`,
  }));
  return {
    titles,
    recommendedTitleIndex,
    thumbnailConcept: video.thumbnailConcept || `${f.thumbTextStyle[0]} composition built around the core image of ${t}.`,
    thumbnailText: t.split(" ").slice(0, 4).join(" ").toUpperCase(),
    description: `${f.descriptionOpener(t)}\n\nIn this video:\n- The core story behind ${t}\n- What most people get wrong\n- What to take away from it\n\n${f.ctas(t)[0]}`,
    tags: [...channel.niche.map((n) => n.toLowerCase()), ...t.toLowerCase().split(" ").filter((w) => w.length > 3).slice(0, 4)],
    chapters,
    pinnedComment: `Thanks for watching — what part of ${t} stood out to you most? Let me know below 👇`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildMockIdeas(channel: ChannelDef, count: number): Omit<Idea, "id" | "dateAdded">[] {
  const f = getFlavor(channel.id);
  const topics = pick(f.ideaTopics, Math.min(count, f.ideaTopics.length));
  while (topics.length < count) topics.push(f.ideaTopics[topics.length % f.ideaTopics.length]);
  return topics.map((topicDef) => {
    const proposedTitle = f.titleTemplates(topicDef.topic)[Math.floor(Math.random() * f.titleTemplates(topicDef.topic).length)];
    return {
      channelId: channel.id,
      topic: topicDef.topic,
      proposedTitle,
      hook: f.openers(topicDef.topic)[0],
      angle: topicDef.angle,
      priority: (["high", "medium", "low"] as const)[Math.floor(Math.random() * 3)],
      status: "new" as const,
      ctrScore: round1(6 + Math.random() * 3.5),
      retentionScore: round1(6 + Math.random() * 3.5),
    };
  });
}

export function buildMockAnalysis(video: Video, channel: ChannelDef): AIAnalysis {
  const m: PerformanceMetrics = video.metrics ?? {};
  const ctr = m.ctr ?? 0;
  const retention = m.avgPercentViewed ?? 0;
  const strongCtr = ctr >= 6.5;
  const strongRetention = retention >= 50;

  let whatWorked: string;
  let whatDidnt: string;
  let why: string;
  let repeat: string;
  let stop: string;
  let nextTest: string;

  if (strongCtr && strongRetention) {
    whatWorked = `Both the packaging and the content itself performed well — CTR of ${ctr}% and ${retention}% average viewed are both above your channel's typical range.`;
    whatDidnt = "No major weak point in this video; the main opportunity is scale, not fixing.";
    why = "The title/thumbnail set an accurate expectation and the video delivered on it within the first third.";
    repeat = "Repeat the exact title/thumbnail formula and opening structure used here.";
    stop = "Nothing to cut — use this as the retention benchmark for future scripts on this channel.";
    nextTest = "Test a bolder title variant to see if CTR can move even higher without hurting retention.";
  } else if (strongCtr && !strongRetention) {
    whatWorked = `CTR is strong at ${ctr}% — the title and thumbnail are clearly earning the click.`;
    whatDidnt = `Retention drops before the halfway point, sitting at ${retention}% average viewed.`;
    why = "The packaging is promising something the opening minutes don't deliver fast enough — a classic expectation gap.";
    repeat = "Keep the current title/thumbnail approach — it's not the problem.";
    stop = "Stop front-loading setup before the payoff; viewers are leaving before the core content starts.";
    nextTest = "Your next video should shorten the setup and reveal the main conflict or payoff earlier — inside the first 30 seconds.";
  } else if (!strongCtr && strongRetention) {
    whatWorked = `Retention is strong at ${retention}% — once people click, the content holds them.`;
    whatDidnt = `CTR is soft at ${ctr}%, meaning the packaging isn't earning enough clicks relative to the content quality.`;
    why = "The thumbnail/title likely isn't communicating the value or stakes clearly enough at a glance.";
    repeat = "Repeat the pacing and structure of the script — it's clearly working.";
    stop = "Stop using low-contrast or text-heavy thumbnails if that's the current pattern.";
    nextTest = "Test 3 new thumbnail concepts with higher contrast and a clearer single focal point against this same video's content.";
  } else {
    whatWorked = "Publishing consistency and topic relevance to the channel are intact.";
    whatDidnt = `Both CTR (${ctr}%) and retention (${retention}%) are below target — this suggests a packaging and a content-pacing issue together.`;
    why = "The premise likely isn't differentiated enough in the title, and the opening doesn't earn attention fast enough once clicked.";
    repeat = "Keep the topic — the niche fit is fine, this is an execution issue, not a topic issue.";
    stop = "Stop opening with slow context-setting; both packaging and pacing need to lead with the sharpest moment.";
    nextTest = "Rebuild the next video's first 15 seconds around the single most surprising fact, and A/B two contrasting title directions.";
  }

  return { whatWorked, whatDidnt, why, repeat, stop, nextTest, generatedAt: new Date().toISOString() };
}

export function buildMockStrategy(
  channels: ChannelDef[],
  videos: Video[],
  ideas: Idea[]
): StrategyRecommendation[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const perChannel = channels.map((c) => {
    const chVideos = videos.filter((v) => v.channelId === c.id);
    const publishedThisMonth = chVideos.filter(
      (v) => v.stage === "published" || v.stage === "analytics"
    ).filter((v) => new Date(v.targetPublishDate).getTime() >= monthStart).length;
    const inProduction = chVideos.filter((v) => !["idea", "published", "analytics"].includes(v.stage)).length;
    const unusedIdeas = ideas.filter((i) => i.channelId === c.id && i.status !== "in-production" && i.status !== "archived");
    const cadenceGap = c.publishFrequencyPerWeek * 4 - publishedThisMonth;
    return { channel: c, publishedThisMonth, inProduction, unusedIdeas, cadenceGap };
  });

  perChannel.sort((a, b) => b.cadenceGap - a.cadenceGap);

  const recs: StrategyRecommendation[] = [];
  for (const entry of perChannel) {
    if (recs.length >= 5) break;
    const f = getFlavor(entry.channel.id);
    const bestIdea = [...entry.unusedIdeas].sort((a, b) => b.ctrScore + b.retentionScore - (a.ctrScore + a.retentionScore))[0];
    if (bestIdea) {
      recs.push({
        channelId: entry.channel.id,
        title: bestIdea.proposedTitle,
        reason: `${entry.channel.name} is ${entry.cadenceGap > 0 ? `${entry.cadenceGap} video(s) behind` : "on pace with"} its ${entry.channel.publishFrequencyPerWeek}/week cadence this month, and this idea already scores well (CTR ${bestIdea.ctrScore}, retention ${bestIdea.retentionScore}) but is sitting unused in the idea bank.`,
        angle: bestIdea.angle,
        estCtr: bestIdea.ctrScore,
        estRetention: bestIdea.retentionScore,
      });
    } else {
      const topicDef = f.ideaTopics[Math.floor(Math.random() * f.ideaTopics.length)];
      recs.push({
        channelId: entry.channel.id,
        title: f.titleTemplates(topicDef.topic)[0],
        reason: `${entry.channel.name} has no unused ideas queued and is ${entry.cadenceGap > 0 ? "falling behind" : "keeping pace with"} its publish cadence — this fills a content gap in ${topicDef.topic.toLowerCase()}.`,
        angle: topicDef.angle,
        estCtr: round1(6.5 + Math.random() * 2.5),
        estRetention: round1(6.5 + Math.random() * 2.5),
      });
    }
  }
  while (recs.length < 5) {
    const c = channels[recs.length % channels.length];
    const f = getFlavor(c.id);
    const topicDef = f.ideaTopics[recs.length % f.ideaTopics.length];
    recs.push({
      channelId: c.id,
      title: f.titleTemplates(topicDef.topic)[0],
      reason: `Adds topic variety to ${c.name} and balances the overall channel mix for the week.`,
      angle: topicDef.angle,
      estCtr: round1(6.5 + Math.random() * 2.5),
      estRetention: round1(6.5 + Math.random() * 2.5),
    });
  }
  return recs.slice(0, 5);
}

export function newIdeaId(): string {
  return uid("idea");
}

export function daysFromNowIso(n: number): string {
  return isoDaysFromNow(n);
}

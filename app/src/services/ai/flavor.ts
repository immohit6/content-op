import { ChannelId } from "../../types";

export interface ChannelFlavor {
  hookAngles: string[];
  openers: (title: string) => string[];
  contextThemes: string[];
  contrarian: (title: string) => string[];
  storyOps: (title: string) => string[];
  factCheck: string[];
  bRoll: (title: string) => string[];
  patternInterrupts: string[];
  ctas: (title: string) => string[];
  thumbTextStyle: string[];
  titleTemplates: (title: string) => string[];
  ideaTopics: { topic: string; angle: string }[];
  descriptionOpener: (title: string) => string;
  scriptTone: string;
}

export const CHANNEL_FLAVOR: Record<ChannelId, ChannelFlavor> = {
  "world-explained": {
    scriptTone: "documentary narrator",
    hookAngles: ["stakes escalation", "cold open on a single moment", "myth vs. reality", "hidden number", "three-act framing"],
    openers: (t) => [
      `Right now, in a place most people couldn't find on a map, the decisions being made will affect all of us. This is ${t}.`,
      `There's a number that explains more about ${t} than any headline will. Let's start there.`,
      `Everyone thinks they understand ${t}. Almost nobody does. Here's why.`,
    ],
    contextThemes: [
      "Historical precedent from the last comparable event",
      "Which regional powers have the most to gain or lose",
      "How global supply chains are quietly exposed to this",
    ],
    contrarian: (t) => [
      `The dominant narrative around ${t} may be overstating the risk — here's the counter-evidence.`,
      `Some analysts argue this is deterrence working, not escalation.`,
    ],
    storyOps: (t) => [`Open on one person or one location affected by ${t}, then zoom out to the system.`],
    factCheck: ["Confirm most recent statistic before publish — figures update annually", "Verify quote attribution against primary source"],
    bRoll: (t) => [`Archival footage relevant to ${t}`, "Slow push-in on maps with animated overlays", "Data chart build-on animation", "Muted color-graded news footage montage"],
    patternInterrupts: ["Hard cut to a single stark statistic on black", "Sudden silence before the turning point", "Freeze-frame with a rhetorical question overlay"],
    ctas: (t) => [`If ${t} raised more questions than it answered, that's the point — drop your take below.`],
    thumbTextStyle: ["3-4 bold words, high contrast", "A single provocative number"],
    titleTemplates: (t) => [
      `${t}`,
      `${t}: What's Really Happening`,
      `The Truth About ${t}`,
      `${t} — Explained`,
      `Why ${t} Matters More Than You Think`,
      `${t}? Here's What They're Not Telling You`,
      `Inside ${t}`,
      `${t} — A Timeline`,
      `The Real Story Behind ${t}`,
      `${t}: A Closer Look`,
    ],
    ideaTopics: [
      { topic: "Resource-driven conflict", angle: "Follow the money before the headlines catch up." },
      { topic: "Alliance realignment", angle: "Old alliances breaking, new ones forming quietly." },
      { topic: "Economic statecraft", angle: "Sanctions and trade as the new battlefield." },
      { topic: "Forgotten conflict", angle: "A crisis the news cycle moved past too fast." },
      { topic: "Demographic shift", angle: "A slow-motion story with fast consequences." },
    ],
    descriptionOpener: (t) => `An explainer on ${t} — the context, the stakes, and what happens next.`,
  },
  "ai-blueprint": {
    scriptTone: "first-person experimenter",
    hookAngles: ["live experiment premise", "surprising failure", "personal stakes", "counterintuitive result", "before/after"],
    openers: (t) => [
      `I didn't expect this to work. But three weeks into testing ${t}, something changed.`,
      `Here's the honest version of ${t} — including the parts that didn't go well.`,
      `I ran this experiment so you don't have to guess if it actually works.`,
    ],
    contextThemes: ["What the tool/model claims to do vs. what it actually does", "Cost and time investment required to replicate this"],
    contrarian: (t) => [`Most videos on ${t} oversell the result — here's what actually broke.`],
    storyOps: (t) => [`Show the failed attempt before the working version of ${t}.`],
    factCheck: ["Re-verify tool pricing/limits at time of publish — these change monthly", "Confirm model version used, note if it changes results"],
    bRoll: (t) => ["Screen recording of the tool in action", "Split-screen before/after result", "Close-up of hands typing the prompt", "Reaction shot to the output"],
    patternInterrupts: ["On-screen counter showing attempt number", "Sudden zoom into the failed output", "Text callout: 'this is where it broke'"],
    ctas: (t) => [`Try ${t} yourself with the prompt/workflow linked below — then tell me what broke for you.`],
    thumbTextStyle: ["Big number or percentage", "Before/after split with arrow"],
    titleTemplates: (t) => [
      `${t}`,
      `I Tried ${t} for 30 Days`,
      `${t} — Honest Results`,
      `Can AI Actually Do ${t}?`,
      `${t}: What Nobody Tells You`,
      `I Was Wrong About ${t}`,
      `${t} (Real Test, Not a Demo)`,
      `The Truth About ${t}`,
      `${t} Broke My Workflow`,
      `${t} — Before vs. After`,
    ],
    ideaTopics: [
      { topic: "AI agent reliability", angle: "Test an agent on a real task and show every failure." },
      { topic: "AI for daily life", angle: "Can AI actually improve one habit, measured honestly." },
      { topic: "Tool comparison", angle: "Same task, five tools, one clear winner." },
      { topic: "AI ethics/privacy", angle: "What you're actually giving up to use this." },
      { topic: "Building with AI", angle: "Ship something real on camera, mistakes included." },
    ],
    descriptionOpener: (t) => `A real, unscripted test of ${t} — what worked, what didn't, and the honest data.`,
  },
  "unfiltered-uncut": {
    scriptTone: "intimate diary narration",
    hookAngles: ["sensory cold open", "emotional confession", "present-tense moment", "quiet vulnerability", "unresolved tension"],
    openers: (t) => [
      `I didn't plan to say this on camera, but here we are. ${t}.`,
      `Some places change you before you understand why. This was one of them.`,
      `I almost didn't film this. I'm glad I did.`,
    ],
    contextThemes: ["What was actually happening in my life around this trip", "The unglamorous, unplanned parts"],
    contrarian: (t) => [`This isn't the polished travel-video version of ${t} — this is the real one.`],
    storyOps: (t) => [`Let a long silent walking shot breathe before the narration starts.`],
    factCheck: ["Confirm location names and spelling before publish"],
    bRoll: (t) => ["Long unbroken walking shots", "Close-up hands, shoes, small sensory details", "Wide static shot held longer than feels comfortable", "Natural ambient sound with no music"],
    patternInterrupts: ["Cut to total silence for 3 seconds", "Sudden handheld shake during an emotional beat", "Hard cut from noise to quiet"],
    ctas: (t) => [`If this felt like something you needed to hear too, I'd love to know in the comments.`],
    thumbTextStyle: ["Minimal or no text — let the image carry it", "Lowercase, quiet type treatment"],
    titleTemplates: (t) => [
      `${t}`,
      `${t} (Walk & Talk)`,
      `${t} — A Quiet Walk`,
      `${t}, Unfiltered`,
      `What I Didn't Say About ${t}`,
      `${t} — Just Me and a Camera`,
      `${t}: The Honest Version`,
      `Alone in ${t}`,
      `${t} — No Script, No Plan`,
      `${t} Changed Something in Me`,
    ],
    ideaTopics: [
      { topic: "Solo night walk", angle: "A city at an hour nobody films it." },
      { topic: "Return to a meaningful place", angle: "Revisit somewhere years later, unscripted." },
      { topic: "Unplanned detour", angle: "What happened when the plan fell apart." },
      { topic: "Silent cinematic walk", angle: "No narration, just presence and sound." },
      { topic: "Vulnerable personal update", angle: "Talk through something real while walking." },
    ],
    descriptionOpener: (t) => `A raw, unscripted walk through ${t} — no plan, just the moment.`,
  },
  "money-with-mo": {
    scriptTone: "practical mentor",
    hookAngles: ["cost-of-inaction number", "myth-bust", "step-by-step promise", "relatable mistake", "before/after net worth"],
    openers: (t) => [
      `Here's the number that should change how you think about ${t}.`,
      `I made this mistake with ${t} so you don't have to.`,
      `Let's do the actual math on ${t} — no fluff, just numbers.`,
    ],
    contextThemes: ["Current rates, thresholds, or rules relevant to this topic", "How this compares between Australia and India where relevant"],
    contrarian: (t) => [`The common advice on ${t} sounds smart but ignores one big variable.`],
    storyOps: (t) => [`Open with a real (anonymized) example of someone who got ${t} wrong.`],
    factCheck: ["Verify current tax brackets/rates before publish — these change yearly", "Double-check all dollar figures against a primary source"],
    bRoll: (t) => ["Screen recording of a spreadsheet/calculator", "Close-up on a calculator or banking app", "Simple animated chart build", "Talking head with lower-third stat callouts"],
    patternInterrupts: ["On-screen running total counter", "Text callout with the exact dollar figure", "Quick cut to a 'wait, what?' reaction"],
    ctas: (t) => [`If ${t} saved or made you money, the next step is linked below — go do the math for your own numbers.`],
    thumbTextStyle: ["Dollar figure in large type", "Before/after number comparison"],
    titleTemplates: (t) => [
      `${t}`,
      `${t} Explained (2026 Numbers)`,
      `The Truth About ${t}`,
      `${t}: What I Wish I Knew Earlier`,
      `${t} — Step by Step`,
      `${t} Is Costing You More Than You Think`,
      `How I'd Approach ${t} Today`,
      `${t}: The Math Nobody Shows You`,
      `${t} — Beginner to Confident`,
      `${t}: Australia vs India`,
    ],
    ideaTopics: [
      { topic: "Tax optimization", angle: "One overlooked deduction or bracket rule." },
      { topic: "First-time investing", angle: "Where a beginner should actually start, with numbers." },
      { topic: "Side hustle math", angle: "Real income and time breakdown, no hype." },
      { topic: "Cost-of-living comparison", angle: "AU vs IN cost breakdown on one category." },
      { topic: "Debt payoff strategy", angle: "A concrete method with a real repayment example." },
    ],
    descriptionOpener: (t) => `A practical, numbers-first breakdown of ${t} — no jargon, no fluff.`,
  },
  "hindi-lofi": {
    scriptTone: "poetic songwriter",
    hookAngles: ["opening imagery", "emotional confession", "single evocative line", "mood-setting question", "memory trigger"],
    openers: (t) => [
      `${t} started as a single line I couldn't stop thinking about.`,
      `Some songs come from a story. This one came from a feeling I couldn't name.`,
      `This is for anyone who's felt exactly what ${t} is about.`,
    ],
    contextThemes: ["The memory or feeling that inspired this song", "The instrumentation choices and why they fit the mood"],
    contrarian: (t) => [`This isn't a sad song dressed as a happy one — it sits in the feeling honestly.`],
    storyOps: (t) => [`Tell the one-line story behind the lyric before the song plays.`],
    factCheck: ["Confirm lyric transliteration spelling for the description"],
    bRoll: (t) => ["Slow-motion candle or rain visuals", "Soft-focus lyric text overlay", "Warm grain film texture loop", "Static ambient scene with subtle movement"],
    patternInterrupts: ["Brief silence before the hook line lands", "Instrumentation drops out for one line", "Visual fades to black before the final verse"],
    ctas: (t) => [`If ${t} felt like something you've lived, tell me which line hit hardest.`],
    thumbTextStyle: ["Song title in elegant script-style type", "Minimal, mood-first, little to no text"],
    titleTemplates: (t) => [
      `${t}`,
      `${t} | Hindi Lofi`,
      `${t} (Official Lyric Video)`,
      `${t} | Original Hindi Song`,
      `${t} — Lofi Mix`,
      `${t} | Emotional Hindi Song`,
      `${t} | Slowed & Ambient`,
      `${t} — A Love Letter`,
      `${t} | Rainy Day Lofi`,
      `${t} | Original Composition`,
    ],
    ideaTopics: [
      { topic: "Monsoon memory", angle: "Rain as the emotional trigger for the whole song." },
      { topic: "Unspoken love", angle: "Feelings never said out loud." },
      { topic: "Healing after loss", angle: "A gentle, hopeful resolution by the final verse." },
      { topic: "Long distance", angle: "Time zones and waiting as the central image." },
      { topic: "Nostalgia for home", angle: "A place more than a person." },
    ],
    descriptionOpener: (t) => `An original Hindi lofi track — ${t}. Lyrics and mood come first.`,
  },
};

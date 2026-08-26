import { AIProviderKind, SpendEntry } from "../types";

interface Rates {
  input: number; // USD per 1M input tokens
  output: number; // USD per 1M output tokens
}

// Anthropic first-party API pricing, verified current as of this writing.
// https://docs.anthropic.com/en/docs/about-claude/pricing
const ANTHROPIC_PRICING: Record<string, Rates> = {
  "claude-fable-5": { input: 10.0, output: 50.0 },
  "claude-mythos-5": { input: 10.0, output: 50.0 },
  "claude-opus-5": { input: 5.0, output: 25.0 },
  "claude-opus-4-8": { input: 5.0, output: 25.0 },
  "claude-opus-4-7": { input: 5.0, output: 25.0 },
  "claude-opus-4-6": { input: 5.0, output: 25.0 },
  "claude-sonnet-5": { input: 2.0, output: 10.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
};
const ANTHROPIC_DEFAULT = ANTHROPIC_PRICING["claude-sonnet-5"];

// OpenAI pricing is approximate (not verified against a live source at build
// time) — used only for the rough spend estimate, not for gating anything
// billing-critical.
const OPENAI_PRICING: Record<string, Rates> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
};
const OPENAI_DEFAULT = OPENAI_PRICING["gpt-4o-mini"];

/**
 * Very rough expected OUTPUT size per feature, in tokens. This deliberately
 * is not the provider's `max_tokens` ceiling (which is a safety cap, not a
 * typical response size) — it's a realistic estimate of what each feature
 * actually tends to generate, used purely to give the user a heads-up
 * before they spend money. Actual cost will vary.
 */
export const EXPECTED_OUTPUT_TOKENS = {
  research: 700,
  script: 2200,
  packaging: 1100,
  ideaEach: 160,
  analysis: 500,
  strategy: 700,
} as const;

function estimateTokens(text: string): number {
  // ~4 characters per token is the standard rough heuristic for English text.
  return Math.max(1, Math.ceil(text.length / 4));
}

/** True cost estimate is only meaningful for a real (non-demo) provider with a key set. */
export function isRealProvider(provider: AIProviderKind, apiKey: string): boolean {
  return provider !== "mock" && apiKey.trim().length > 0;
}

export function estimateCostUSD(
  provider: AIProviderKind,
  model: string,
  inputText: string,
  expectedOutputTokens: number
): number {
  if (provider === "mock") return 0;
  const table = provider === "anthropic" ? ANTHROPIC_PRICING : OPENAI_PRICING;
  const fallback = provider === "anthropic" ? ANTHROPIC_DEFAULT : OPENAI_DEFAULT;
  const rates = table[model.trim()] ?? fallback;
  const inputTokens = estimateTokens(inputText);
  return (inputTokens / 1_000_000) * rates.input + (expectedOutputTokens / 1_000_000) * rates.output;
}

/** Sum of estimated cost for entries within the last 24 hours (rolling window, not calendar-day). */
export function spendInLast24h(entries: SpendEntry[]): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return entries.reduce((sum, e) => (new Date(e.timestamp).getTime() >= cutoff ? sum + e.estCostUSD : sum), 0);
}

export function formatUSD(n: number): string {
  if (n <= 0) return "Free";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

export function formatUSDPrecise(n: number): string {
  if (n <= 0) return "$0.00";
  if (n < 0.0001) return "<$0.0001";
  return `$${n.toFixed(4)}`;
}

import { useStore } from "../store/store";
import { toast } from "../store/uiStore";
import { formatUSD, spendInLast24h } from "./pricing";

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  mock: "Demo",
};

/**
 * Shared spend-guard for every AI "Generate"/"Analyze" action.
 *
 * Demo mode never calls a real API, so it's always free and never prompts.
 * A real (non-mock) call is:
 *   1. blocked outright if it would push either the lifetime total or the
 *      trailing-24-hour total over their respective limits, and
 *   2. otherwise still requires an explicit confirm on every single call —
 *      no real API call fires just because a budget happens to allow it.
 * A successful real call's estimated cost is logged to the running total.
 */
export function useAIBudgetGuard() {
  const budgetLimitUSD = useStore((s) => s.settings.budgetLimitUSD);
  const dailyBudgetLimitUSD = useStore((s) => s.settings.dailyBudgetLimitUSD);
  const spend = useStore((s) => s.spend);
  const recordSpend = useStore((s) => s.recordSpend);
  const aiSettings = useStore((s) => s.settings.ai);

  const spentLast24h = spendInLast24h(spend.entries);

  function confirmSpend(estCostUSD: number, featureLabel: string): boolean {
    if (estCostUSD <= 0) return true;

    if (spend.totalUSD + estCostUSD > budgetLimitUSD) {
      toast(
        `Budget limit reached (spent ~${formatUSD(spend.totalUSD)} of ${formatUSD(budgetLimitUSD)}). Raise the limit in Settings, or switch the provider to Demo to keep going for free.`,
        "error"
      );
      return false;
    }

    if (spentLast24h + estCostUSD > dailyBudgetLimitUSD) {
      toast(
        `24-hour budget reached (spent ~${formatUSD(spentLast24h)} of ${formatUSD(dailyBudgetLimitUSD)} in the last 24h). Raise the daily limit in Settings, or try again once it rolls off, or switch to Demo mode.`,
        "error"
      );
      return false;
    }

    const providerLabel = PROVIDER_LABEL[aiSettings.provider] ?? aiSettings.provider;
    const ok = window.confirm(
      `${featureLabel} will call ${providerLabel} (${aiSettings.model || "default model"}) and cost approximately ${formatUSD(estCostUSD)}.\n\nProceed?`
    );
    if (!ok) toast("Cancelled — no charge made.");
    return ok;
  }

  function logSpend(feature: string, estCostUSD: number) {
    if (estCostUSD <= 0) return;
    recordSpend({ feature, provider: aiSettings.provider, model: aiSettings.model, estCostUSD });
  }

  return { confirmSpend, logSpend, budgetLimitUSD, dailyBudgetLimitUSD, spentUSD: spend.totalUSD, spentLast24h, aiSettings };
}

import React from "react";
import { ChannelDef, PRIORITY_META, Priority, STAGE_LABELS, Stage } from "../types";
import { cx } from "../lib/utils";
import { channelTextColor } from "../lib/color";
import { useStore } from "../store/store";
import { formatUSD } from "../lib/pricing";

/** Small "~$0.02 est." caption shown next to a real (non-mock) AI action. Renders nothing in demo mode. */
export function CostHint({ costUSD }: { costUSD: number }) {
  if (costUSD <= 0) return null;
  return <span className="text-xs text-base-400">~{formatUSD(costUSD)} est.</span>;
}

// priority/stage normally come from this app's own typed code, but can also
// arrive from imported JSON (no runtime validation) or a real AI response
// that didn't quite follow the requested enum — fall back instead of
// crashing every card/badge that renders one.
const FALLBACK_PRIORITY_META = { label: "Unknown", dot: "bg-base-500", text: "text-base-400" };

export function PriorityDot({ priority, className }: { priority: Priority; className?: string }) {
  const meta = PRIORITY_META[priority] ?? FALLBACK_PRIORITY_META;
  return <span className={cx("inline-block h-2.5 w-2.5 rounded-full shrink-0", meta.dot, className)} title={meta.label} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority] ?? FALLBACK_PRIORITY_META;
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs font-medium", meta.text)}>
      <PriorityDot priority={priority} />
      {meta.label}
    </span>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className="inline-flex items-center rounded-md bg-base-800 border border-base-600 px-2 py-0.5 text-xs font-medium text-base-200">
      {STAGE_LABELS[stage] ?? stage ?? "Unknown"}
    </span>
  );
}

export function ChannelPill({ channel }: { channel: ChannelDef }) {
  const theme = useStore((s) => s.settings.theme);
  const textColor = channelTextColor(channel.color, theme);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border"
      style={{ color: textColor, borderColor: `${channel.color}55`, backgroundColor: `${channel.color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: channel.color }} />
      {channel.name}
    </span>
  );
}

export function ScoreBadge({ label, value }: { label: string; value: number }) {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? value : null;
  const color = safeValue === null ? "text-base-500" : safeValue >= 8 ? "text-emerald-400" : safeValue >= 6.5 ? "text-amber-300" : "text-base-300";
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-base-400">{label}</span>
      <span className={cx("font-semibold", color)}>{safeValue === null ? "—" : safeValue.toFixed(1)}</span>
    </span>
  );
}

export function NextActionBanner({ action, minutes }: { action: string; minutes?: number }) {
  return (
    <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-soft">Next Action</div>
      <div className="mt-0.5 text-sm text-base-100">
        {action}
        {minutes ? <span className="text-base-400"> · ~{minutes} min</span> : null}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className="mt-1 text-xl font-semibold text-base-100">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-base-400">{sub}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="text-sm font-medium text-base-200">{title}</div>
      {body ? <div className="max-w-sm text-xs text-base-400">{body}</div> : null}
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10 sm:pt-16" onClick={onClose}>
      <div
        className={cx("card w-full animate-[fadeIn_0.15s_ease-out]", wide ? "max-w-3xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-base-700 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-base-100">{title}</h2>
          <button onClick={onClose} className="btn-ghost !px-2 !py-1 text-base-400">
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-100">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

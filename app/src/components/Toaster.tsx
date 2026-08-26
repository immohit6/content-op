import React from "react";
import { useUIStore } from "../store/uiStore";
import { cx } from "../lib/utils";

const TONE_STYLES = {
  default: "border-base-600 bg-base-850",
  success: "border-emerald-500/40 bg-emerald-950/90",
  error: "border-red-500/40 bg-red-950/90",
};

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={cx(
            "cursor-pointer rounded-lg border px-4 py-3 text-sm text-base-100 shadow-card animate-[fadeIn_0.15s_ease-out]",
            TONE_STYLES[t.tone]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

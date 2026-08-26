import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store";
import { PageHeader } from "../components/layout";
import { EmptyState } from "../components/common";
import { buildDailyPlan } from "../services/planService";
import { cx, todayIso } from "../lib/utils";

export default function TodayWork() {
  const navigate = useNavigate();
  const videos = useStore((s) => s.videos);
  const dailyPlan = useStore((s) => s.dailyPlan);
  const setDailyPlan = useStore((s) => s.setDailyPlan);
  const toggleDailyItem = useStore((s) => s.toggleDailyItem);

  useEffect(() => {
    if (!dailyPlan || dailyPlan.date !== todayIso()) {
      setDailyPlan(buildDailyPlan(videos));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function regenerate() {
    setDailyPlan(buildDailyPlan(videos));
  }

  const items = dailyPlan?.items ?? [];
  const doneCount = items.filter((i) => i.done).length;
  const totalMinutes = items.reduce((s, i) => s + i.minutes, 0);
  const remainingMinutes = items.filter((i) => !i.done).reduce((s, i) => s + i.minutes, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Today's Work"
        subtitle="Your unfinished content, turned into a simple plan."
        action={
          <button className="btn-secondary" onClick={regenerate}>
            ↻ Regenerate plan
          </button>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="Nothing on the plan" body="Every video is either published or waiting on a review." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 text-sm text-base-300">
            <span>
              <span className="font-semibold text-base-100">{doneCount}</span> / {items.length} done
            </span>
            <span>
              <span className="font-semibold text-base-100">{remainingMinutes}</span> min remaining of {totalMinutes} min total
            </span>
          </div>

          <div className="card divide-y divide-base-700/60">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                <button
                  onClick={() => toggleDailyItem(item.id)}
                  className={cx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    item.done ? "border-accent bg-accent text-white" : "border-base-500 text-transparent hover:border-accent"
                  )}
                >
                  ✓
                </button>
                <button
                  onClick={() => navigate(`/video/${item.videoId}`)}
                  className={cx("flex-1 text-left text-sm", item.done ? "text-base-500 line-through" : "text-base-100 hover:text-accent-soft")}
                >
                  <span className="mr-2 text-base-500">{i + 1}.</span>
                  {item.label}
                </button>
                <span className="shrink-0 text-xs text-base-400">{item.minutes} min</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

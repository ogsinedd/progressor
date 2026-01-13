"use client";

import type { SphereScore } from "@/lib/weekly-score";

type Props = {
  sphereScore: SphereScore;
};

const sphereIcons: Record<string, string> = {
  yoga: "🧘",
  fitness: "💪",
  programming: "💻",
  reading: "📚",
  nutrition: "🥗",
  finance: "💰",
};

const sphereLabels: Record<string, string> = {
  yoga: "Йога",
  fitness: "Фитнес",
  programming: "Программирование",
  reading: "Чтение",
  nutrition: "Питание",
  finance: "Финансы",
};

export function WeeklyScoreCard({ sphereScore }: Props) {
  const { sphere, score, goals, trend } = sphereScore;

  const statusColor =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-slate-500 dark:text-slate-400";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sphereIcons[sphere] || "📊"}</span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {sphereLabels[sphere] || sphere}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {goals.length} {goals.length === 1 ? "цель" : "целей"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${statusColor}`}>{score.toFixed(0)}</p>
          <p className={`text-xs font-medium ${trendColor}`}>{trendIcon} Тренд</p>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="space-y-1 border-t border-slate-100 pt-2 dark:border-slate-700">
          {goals.slice(0, 3).map((goal) => (
            <div
              key={goal.goalId}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-slate-600 dark:text-slate-400">
                {goal.name}
              </span>
              <span
                className={
                  goal.score >= 100
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }
              >
                {goal.score.toFixed(0)}%
              </span>
            </div>
          ))}
          {goals.length > 3 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +{goals.length - 3} ещё
            </p>
          )}
        </div>
      )}
    </div>
  );
}

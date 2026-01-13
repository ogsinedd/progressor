"use client";

import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";

type Props = {
  activityData: { date: string; count: number }[];
};

export function WeeklyActivityHeatmap({ activityData }: Props) {
  // Последние 7 дней
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const activity = activityData.find((a) => a.date === dateStr);
    return {
      date,
      dateStr,
      count: activity?.count || 0,
      dayName: format(date, "EEEEE", { locale: ru }),
    };
  });

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          🔥 Активность за неделю
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Выполненных целей
        </p>
      </div>

      <div className="flex justify-between gap-2">
        {days.map((day, index) => {
          const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxCount) * 4);
          const colorClasses = [
            "bg-slate-100 dark:bg-slate-700",
            "bg-emerald-200 dark:bg-emerald-900/40",
            "bg-emerald-400 dark:bg-emerald-700/60",
            "bg-emerald-500 dark:bg-emerald-600/80",
            "bg-emerald-600 dark:bg-emerald-500",
          ];

          const isToday = index === 6;

          return (
            <div key={day.dateStr} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {day.dayName}
              </span>
              <div
                className={`flex h-16 w-full items-center justify-center rounded-lg ${
                  colorClasses[intensity]
                } ${isToday ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800" : ""} transition-colors`}
                title={`${format(day.date, "d MMM", { locale: ru })}: ${day.count} ${
                  day.count === 1 ? "цель" : "целей"
                }`}
              >
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {day.count > 0 ? day.count : "—"}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {format(day.date, "d", { locale: ru })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="h-3 w-3 rounded bg-slate-100 dark:bg-slate-700" />
        <span>Нет</span>
        <span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-900/40" />
        <span className="h-3 w-3 rounded bg-emerald-400 dark:bg-emerald-700/60" />
        <span className="h-3 w-3 rounded bg-emerald-500 dark:bg-emerald-600/80" />
        <span className="h-3 w-3 rounded bg-emerald-600 dark:bg-emerald-500" />
        <span>Много</span>
      </div>
    </div>
  );
}

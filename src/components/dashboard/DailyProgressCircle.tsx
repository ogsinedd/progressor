"use client";

type Props = {
  completed: number;
  total: number;
  label: string;
};

export function DailyProgressCircle({ completed, total, label }: Props) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? "stroke-emerald-500"
      : percentage >= 50
        ? "stroke-amber-500"
        : "stroke-rose-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-500`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {completed}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            из {total}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {percentage}% выполнено
      </p>
    </div>
  );
}

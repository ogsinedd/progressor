import Link from "next/link";
import type { SavingsGoal } from "@/generated/prisma/client";

type Props = {
  goals: Array<
    SavingsGoal & {
      currentAmount: number;
      progress: number;
    }
  >;
  totalSavings: number;
  currency: string;
};

export function SavingsWidget({ goals, totalSavings, currency }: Props) {
  // Выбираем "цель месяца" (с наименьшим прогрессом среди активных)
  const goalOfMonth = goals
    .filter((g) => g.isActive && !g.archived && g.progress < 100)
    .sort((a, b) => a.progress - b.progress)[0];

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              💰 Накопления
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Нет активных целей
            </p>
          </div>
          <Link
            href="/finances/goals/new"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Создать цель
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            💰 Накопления
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Всего:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {totalSavings.toFixed(2)} {currency}
            </span>
          </p>
        </div>
        <Link
          href="/finances"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Перейти в Финансы →
        </Link>
      </div>

      {goalOfMonth && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Цель месяца
          </p>
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {goalOfMonth.icon && (
              <span className="mr-1">{goalOfMonth.icon}</span>
            )}
            {goalOfMonth.name}
          </p>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              {goalOfMonth.currentAmount.toFixed(2)} / {goalOfMonth.targetAmount.toFixed(2)} {currency}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {goalOfMonth.progress.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
            <div
              className="h-full bg-emerald-500 transition-all dark:bg-emerald-400"
              style={{ width: `${Math.min(goalOfMonth.progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!goalOfMonth && goals.length > 0 && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          ✅ Все цели достигнуты!
        </p>
      )}
    </div>
  );
}

import type { SavingsGoal } from "@/generated/prisma/client";
import { ProgressBar } from "../ProgressBar";

type Props = {
  goal: SavingsGoal & {
    currentAmount: number;
    progress: number;
  };
  onAddEntry?: () => void;
};

const typeLabels = {
  GOAL_SAVINGS: "Накопление",
  SINKING_FUND: "Копилка",
  EMERGENCY_FUND: "Подушка",
};

export function SavingsGoalCard({ goal, onAddEntry }: Props) {
  const status =
    goal.progress >= 100 ? "green" : goal.progress >= 60 ? "yellow" : "red";

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {typeLabels[goal.type]} · {goal.currency}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {goal.icon && <span className="mr-2">{goal.icon}</span>}
            {goal.name}
          </h3>
          {goal.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {goal.description}
            </p>
          )}
        </div>
        <div className="text-right text-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Текущий баланс</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {goal.currentAmount.toFixed(2)} {goal.currency}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Цель: {goal.targetAmount.toFixed(2)} {goal.currency}
          </p>
          {remaining > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Осталось: {remaining.toFixed(2)} {goal.currency}
            </p>
          )}
        </div>
      </div>

      <ProgressBar
        percent={goal.progress}
        status={status}
        label={`Прогресс: ${goal.progress.toFixed(1)}%`}
      />

      {goal.dueDate && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Срок: {new Date(goal.dueDate).toLocaleDateString("ru-RU")}
        </p>
      )}

      {onAddEntry && (
        <button
          onClick={onAddEntry}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Добавить пополнение
        </button>
      )}
    </div>
  );
}

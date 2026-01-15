import type React from "react";
import type { Goal } from "@/generated/prisma/client";
import { GoalPeriod, GoalType } from "@/generated/prisma/enums";
import { ProgressBar } from "@/components/ProgressBar";
import { GoalQuickForm } from "@/components/GoalQuickForm";
import type { ProgressState } from "@/lib/progress";

type Props = {
  goal: Goal & { entries?: unknown };
  progress: ProgressState;
  todayValue?: number | null;
  todayNote?: string | null;
  streak?: number;
  showForm?: boolean;
  actionButton?: React.ReactNode;
};

const periodLabels: Record<GoalPeriod, string> = {
  [GoalPeriod.DAILY]: "Каждый день",
  [GoalPeriod.WEEKLY]: "Каждую неделю",
  [GoalPeriod.MONTHLY]: "Каждый месяц",
  [GoalPeriod.YEARLY]: "Каждый год",
  [GoalPeriod.CUSTOM]: "Диапазон",
};

const typeLabels: Record<GoalType, string> = {
  [GoalType.BINARY]: "Бинарная",
  [GoalType.QUANTITATIVE]: "Количественная",
  [GoalType.FINANCIAL]: "Финансовая",
};

export function GoalCard({
  goal,
  progress,
  todayValue,
  todayNote,
  streak,
  showForm = false,
  actionButton,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {periodLabels[goal.period]} · {typeLabels[goal.type]}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{goal.description}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-start gap-3">
          
          {streak !== undefined && streak > 0 && (
            <div className="text-right text-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400">Серия</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{streak} 🔥</p>
            </div>
          )}
          <div className="text-right text-sm text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {progress.current} / {progress.target || "—"}{" "}
              {goal.targetUnit ?? ""}
            </p>
            <p
              className={
                progress.status === "green"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : progress.status === "yellow"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-rose-600 dark:text-rose-400"
              }
            >
              {progress.percent}% готово
            </p>
            {actionButton && <div className="self-start">{actionButton}</div>}
          </div>
        </div>
      </div>

      <ProgressBar
        percent={progress.percent}
        status={progress.status}
        label="Текущий период"
      />

      {showForm && (
        <GoalQuickForm
          goalId={goal.id}
          title={goal.title}
          type={goal.type}
          target={goal.target}
          unit={goal.targetUnit ?? undefined}
          defaultValue={todayValue ?? undefined}
          defaultNote={todayNote ?? undefined}
        />
      )}
    </div>
  );
}


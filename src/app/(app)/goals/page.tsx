import { addMonths } from "date-fns";

import { ArchiveGoalButton } from "@/components/ArchiveGoalButton";
import { DeleteGoalButton } from "@/components/DeleteGoalButton";
import { UnarchiveGoalButton } from "@/components/UnarchiveGoalButton";
import { GoalCard } from "@/components/GoalCard";
import { GoalForm } from "@/components/GoalForm";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateProgress } from "@/lib/progress";

export default async function GoalsPage() {
  const user = await requireUser();
  const now = new Date();

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    include: {
      entries: {
        where: {
          date: { gte: addMonths(now, -6) },
        },
      },
    },
    orderBy: [{ archived: "asc" }, { createdAt: "desc" }],
  });

  const active = goals.filter((g) => !g.archived);
  const archived = goals.filter((g) => g.archived);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Конструктор целей</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Цели</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Универсальная модель: количественные, бинарные, финансовые, любые
            периоды.
          </p>
        </div>
      </div>

      <GoalForm />

      <div className="grid gap-3">
        {active.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            progress={calculateProgress(goal, now)}
            showForm={false}
            actionButton={<ArchiveGoalButton goalId={goal.id} />}
          />
        ))}
        {active.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Активных целей пока нет. Добавьте новую через форму выше.
          </div>
        )}
      </div>

      {archived.length > 0 && (
        <div className="grid gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Архив ({archived.length})
          </h2>
          {archived.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={calculateProgress(goal, now)}
              showForm={false}
              actionButton={
                <div className="flex flex-col md:flex-row gap-2">
                  <UnarchiveGoalButton goalId={goal.id} />
                  <DeleteGoalButton goalId={goal.id} />
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}


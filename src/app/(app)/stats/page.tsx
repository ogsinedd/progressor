import { addMonths } from "date-fns";

import { ProgressBar } from "@/components/ProgressBar";
import { ProgressChart } from "@/components/ProgressChart";
import { WeeklyScoreCard } from "@/components/WeeklyScoreCard";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateProgress } from "@/lib/progress";
import { calculateStreak, getProgressHistory } from "@/lib/streaks";
import { getWeeklyScore } from "@/lib/weekly-score";

export default async function StatsPage() {
  const user = await requireUser();
  const now = new Date();

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, archived: false },
    include: {
      entries: {
        where: { date: { gte: addMonths(now, -6) } },
      },
    },
  });

  const progressItems = goals.map((goal) => {
    const progress = calculateProgress(goal, now);
    const streak = calculateStreak(goal);
    const history = getProgressHistory(goal, 30);
    return { goal, progress, streak, history };
  });

  const weeklyScore = await getWeeklyScore(user.id, "week");
  const spheres = ["yoga", "fitness", "programming", "reading", "nutrition", "finance"];
  const validSpheres = spheres
    .map((sphere) => weeklyScore.scores[sphere])
    .filter((s) => s && s.goals.length > 0);

  const averagePercent =
    progressItems.length === 0
      ? 0
      : Math.round(
          progressItems.reduce((sum, item) => sum + item.progress.percent, 0) /
            progressItems.length,
        );

  const totalCurrentStreak = progressItems.reduce(
    (sum, item) => sum + item.streak.current,
    0
  );
  const maxStreak = Math.max(
    ...progressItems.map((item) => item.streak.longest),
    0
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Обзор</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Статистика</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Прогресс по периодам без лишних украшательств.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Уровень</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {user.level} · {user.xp} XP
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Средний прогресс</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {averagePercent}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Активные серии</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {totalCurrentStreak} {totalCurrentStreak === 1 ? "день" : "дней"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Рекорд серии</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {maxStreak} {maxStreak === 1 ? "день" : "дней"}
            </p>
          </div>
        </div>
      </div>

      {validSpheres.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            📊 Weekly Score по сферам
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {validSpheres.map((sphereScore) => (
              <WeeklyScoreCard key={sphereScore.sphere} sphereScore={sphereScore} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {progressItems.map(({ goal, progress, streak, history }) => (
          <div
            key={goal.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {goal.period.toLowerCase()} · {goal.type.toLowerCase()}
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{goal.description}</p>
                )}
              </div>
              <div className="flex gap-3 text-right text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Текущий период</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {progress.current} / {progress.target || "—"}{" "}
                    {goal.targetUnit ?? ""}
                  </p>
                </div>
                <div className="border-l border-slate-200 pl-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Серия</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {streak.current} 🔥
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    рекорд: {streak.longest}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <ProgressBar
                percent={progress.percent}
                status={progress.status}
                label="Текущий период"
              />
            </div>

            <ProgressChart
              data={history}
              target={goal.target ?? undefined}
              unit={goal.targetUnit ?? ""}
              title="Последние 30 дней"
            />
          </div>
        ))}
        {progressItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Добавьте цели, чтобы увидеть статистику.
          </div>
        )}
      </div>
    </div>
  );
}


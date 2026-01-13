import { addDays, format, subDays } from "date-fns";

import { GoalCard } from "@/components/GoalCard";
import { SavingsWidget } from "@/components/savings/SavingsWidget";
import { DailyProgressCircle } from "@/components/dashboard/DailyProgressCircle";
import { LevelProgressBar } from "@/components/dashboard/LevelProgressBar";
import { WeeklyActivityHeatmap } from "@/components/dashboard/WeeklyActivityHeatmap";
import { MotivationalStats } from "@/components/dashboard/MotivationalStats";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateProgress, findEntryForDate } from "@/lib/progress";
import { calculateStreak } from "@/lib/streaks";
import {
  calculateGoalBalance,
  calculateGoalProgress,
} from "@/lib/savings-aggregators";

export default async function TodayPage() {
  const user = await requireUser();
  const now = new Date();

  const goals = await prisma.goal.findMany({
    where: {
      userId: user.id,
      archived: false,
      startDate: { lte: now },
      // Убрали фильтр по endDate - цели не исчезают автоматически
    },
    include: {
      entries: {
        where: {
          date: {
            gte: addDays(now, -120),
          },
        },
        orderBy: { date: "desc" },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  const summaries = goals.map((goal) => {
    const progress = calculateProgress(goal, now);
    const todayEntry = findEntryForDate(goal.entries, now);
    const streak = calculateStreak(goal);
    return { goal, progress, todayEntry, streak };
  });

  const completed = summaries.filter((s) => s.progress.status === "green")
    .length;

  const totalActiveStreaks = summaries.reduce(
    (sum, s) => sum + s.streak.current,
    0
  );

  // Вычисляем максимальную серию
  const longestStreak = Math.max(
    ...summaries.map((s) => s.streak.longest),
    0
  );

  // XP до следующего уровня (формула: level * 100)
  const xpForNextLevel = (user.level + 1) * 100;

  // Активность за последнюю неделю
  const weekStart = subDays(now, 6);
  const allEntriesLastWeek = await prisma.goalEntry.findMany({
    where: {
      goal: { userId: user.id },
      date: { gte: weekStart },
    },
    select: {
      date: true,
      value: true,
      goal: {
        select: {
          type: true,
          target: true,
        },
      },
    },
  });

  // Группируем по датам
  const activityByDate = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const date = subDays(now, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    activityByDate.set(dateStr, 0);
  }

  allEntriesLastWeek.forEach((entry) => {
    const dateStr = format(entry.date, "yyyy-MM-dd");
    const isComplete =
      entry.goal.type === "BINARY"
        ? entry.value === 1
        : entry.goal.target
          ? entry.value >= entry.goal.target
          : entry.value > 0;
    if (isComplete && activityByDate.has(dateStr)) {
      activityByDate.set(dateStr, (activityByDate.get(dateStr) || 0) + 1);
    }
  });

  const activityData = Array.from(activityByDate.entries()).map(
    ([date, count]) => ({ date, count })
  );

  // Процент завершения за неделю
  const totalGoalsThisWeek = summaries.length * 7;
  const completedThisWeek = Array.from(activityByDate.values()).reduce(
    (sum, count) => sum + count,
    0
  );
  const weekCompletion =
    totalGoalsThisWeek === 0
      ? 0
      : Math.round((completedThisWeek / totalGoalsThisWeek) * 100);

  // Всего выполненных целей за всё время
  const totalCompletedAllTime = await prisma.goalEntry.count({
    where: {
      goal: { userId: user.id },
      OR: [
        { value: { gte: 1 }, goal: { type: "BINARY" } },
        { value: { gt: 0 }, goal: { type: { not: "BINARY" } } },
      ],
    },
  });

  // Загружаем финансовые цели
  const savingsGoals = await prisma.savingsGoal.findMany({
    where: {
      userId: user.id,
      archived: false,
      isActive: true,
    },
    include: {
      entries: {
        orderBy: { date: "desc" },
      },
    },
    take: 5,
  });

  const enrichedSavingsGoals = savingsGoals.map((goal) => ({
    ...goal,
    currentAmount: calculateGoalBalance(goal),
    progress: calculateGoalProgress(goal),
  }));

  const totalSavings = enrichedSavingsGoals.reduce(
    (sum, g) => sum + g.currentAmount,
    0
  );

  const currency = savingsGoals[0]?.currency || "EUR";

  return (
    <div className="flex flex-col gap-5">
      {/* Заголовок */}
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Дашборд</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Сегодня
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ваш прогресс и мотивация в одном месте
        </p>
      </div>

      {/* Мотивационная статистика */}
      <MotivationalStats
        longestStreak={longestStreak}
        totalCompleted={totalCompletedAllTime}
        weekCompletion={weekCompletion}
      />

      {/* Прогресс уровня */}
      <LevelProgressBar
        currentLevel={user.level}
        currentXP={user.xp}
        xpForNextLevel={xpForNextLevel}
      />

      {/* Круговые диаграммы прогресса */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          📊 Прогресс на сегодня
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <DailyProgressCircle
            completed={completed}
            total={summaries.length}
            label="Цели выполнены"
          />
          <DailyProgressCircle
            completed={summaries.filter((s) => s.todayEntry).length}
            total={summaries.length}
            label="Активность сегодня"
          />
          <DailyProgressCircle
            completed={summaries.filter((s) => s.streak.current > 0).length}
            total={summaries.length}
            label="Серии активны"
          />
        </div>
      </div>

      {/* Тепловая карта активности */}
      <WeeklyActivityHeatmap activityData={activityData} />

      {/* Виджет финансов */}
      {enrichedSavingsGoals.length > 0 && (
        <SavingsWidget
          goals={enrichedSavingsGoals}
          totalSavings={totalSavings}
          currency={currency}
        />
      )}

      {/* Ваши цели на сегодня */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            🎯 Ваши цели на сегодня
          </h2>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {completed} / {summaries.length} выполнено
          </div>
        </div>

        {summaries.length > 0 && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              💡 <strong>Подсказка:</strong> Введите значение в поле ниже каждой
              цели и нажмите "Сохранить", чтобы добавить прогресс за сегодня
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {summaries.map(({ goal, progress, todayEntry, streak }) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
              todayValue={todayEntry?.value}
              todayNote={todayEntry?.note}
              streak={streak.current}
              showForm
            />
          ))}
          {summaries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <p className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Пока нет активных целей
              </p>
              <p className="mb-4">
                Добавьте первую цель на вкладке «Цели», чтобы начать отслеживать
                прогресс
              </p>
              <a
                href="/goals"
                className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Создать первую цель
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


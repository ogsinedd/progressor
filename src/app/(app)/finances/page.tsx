import Link from "next/link";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  calculateGoalBalance,
  calculateGoalProgress,
  getTotalSavingsOverTime,
  getMonthlyContributions,
} from "@/lib/savings-aggregators";
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard";
import { ProgressChart } from "@/components/ProgressChart";

export default async function FinancesPage() {
  const user = await requireUser();

  const goals = await prisma.savingsGoal.findMany({
    where: {
      userId: user.id,
      archived: false,
    },
    include: {
      entries: {
        orderBy: { date: "desc" },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  // Обогащаем цели текущими балансами и прогрессом
  const enrichedGoals = goals.map((goal) => ({
    ...goal,
    currentAmount: calculateGoalBalance(goal),
    progress: calculateGoalProgress(goal),
  }));

  const totalSavings = enrichedGoals.reduce(
    (sum, g) => sum + g.currentAmount,
    0
  );

  // Получаем данные для графиков
  const { data: timelineData } = await getTotalSavingsOverTime(user.id, 30);
  const { data: monthlyData, averageMonthly } = await getMonthlyContributions(
    user.id,
    12
  );

  // Получаем основную валюту (из первой цели)
  const currency = goals[0]?.currency || "EUR";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Финансы
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            💰 Накопления
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Управление целями накоплений и отслеживание прогресса
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">
              Всего накоплено
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {totalSavings.toFixed(2)} {currency}
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">
              Средний взнос/мес
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {averageMonthly.toFixed(2)} {currency}
            </p>
          </div>
          <Link
            href="/finances/goals/new"
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            + Новая цель
          </Link>
        </div>
      </div>

      {/* Графики */}
      {timelineData.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Динамика накоплений (30 дней)
            </h2>
            <ProgressChart
              data={timelineData.map((d) => ({
                date: d.date,
                value: d.total,
              }))}
              unit={currency}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Месячные взносы (12 месяцев)
            </h2>
            <div className="flex h-40 items-end gap-2">
              {monthlyData.map((m) => {
                const maxAmount = Math.max(...monthlyData.map((d) => d.amount));
                const heightPercent =
                  maxAmount > 0 ? (m.amount / maxAmount) * 100 : 0;
                return (
                  <div
                    key={m.month}
                    className="group relative flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-blue-500 transition-all group-hover:bg-blue-600 dark:bg-blue-400"
                      style={{ height: `${heightPercent}%` }}
                      title={`${m.month}: ${m.amount.toFixed(2)} ${currency}`}
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {m.month.substring(5)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Список целей */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Ваши цели
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            💡 Кликните на цель, чтобы пополнить
          </p>
        </div>
        <div className="grid gap-4">
          {enrichedGoals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Создайте первую цель накоплений
            </p>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Отслеживайте прогресс и достигайте финансовых целей
            </p>
            <Link
              href="/finances/goals/new"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Создать цель
            </Link>
          </div>
        ) : (
          enrichedGoals.map((goal) => (
            <Link
              key={goal.id}
              href={`/finances/goals/${goal.id}`}
              className="block transition hover:opacity-80"
              title={`Открыть детали цели "${goal.name}"`}
            >
              <SavingsGoalCard goal={goal} />
            </Link>
          ))
        )}
        </div>
      </div>
    </div>
  );
}

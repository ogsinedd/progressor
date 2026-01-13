import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getGoalProgressDetails } from "@/lib/savings-aggregators";
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard";
import { SavingsEntryForm } from "@/components/savings/SavingsEntryForm";
import { ProgressChart } from "@/components/ProgressChart";

export default async function SavingsGoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const goalData = await getGoalProgressDetails(id);

  if (!goalData || goalData.goal.userId !== user.id) {
    notFound();
  }

  const { goal, entries, projection } = goalData;

  // Подготовка данных для графика (последние 30 записей)
  const chartData = entries
    .slice(0, 30)
    .reverse()
    .map((entry) => ({
      date: entry.date.toISOString(),
      value: entry.amount,
    }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href="/finances"
            className="mb-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Назад к финансам
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Детали цели
          </h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SavingsGoalCard goal={goal} />

          {projection && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                📊 Прогноз
              </p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Средний взнос в месяц:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {projection.averageMonthly} {goal.currency}
                  </span>
                </div>
                {projection.estimatedDate && projection.daysRemaining && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        Прогноз достижения:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {new Date(projection.estimatedDate).toLocaleDateString(
                          "ru-RU"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        Осталось дней:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        ~{projection.daysRemaining}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                История пополнений
              </p>
              <ProgressChart
                data={chartData}
                unit={goal.currency}
              />
            </div>
          )}
        </div>

        <div>
          <SavingsEntryForm
            goalId={goal.id}
            goalName={goal.name}
            currency={goal.currency}
          />

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Последние записи
            </p>
            <div className="space-y-2">
              {entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm dark:border-slate-700"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {entry.amount > 0 ? "+" : ""}
                      {entry.amount.toFixed(2)} {goal.currency}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {entry.date.toLocaleDateString("ru-RU")}
                      {entry.source && ` · ${entry.source}`}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Пока нет записей
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

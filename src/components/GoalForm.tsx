"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { GoalMetric, GoalPeriod, GoalType } from "@/generated/prisma/enums";
import { upsertGoalAction } from "@/lib/actions";

const typeOptions = [
  { value: GoalType.QUANTITATIVE, label: "Количественная" },
  { value: GoalType.BINARY, label: "Бинарная" },
  { value: GoalType.FINANCIAL, label: "Финансовая" },
];

const periodOptions = [
  { value: GoalPeriod.DAILY, label: "Ежедневно" },
  { value: GoalPeriod.WEEKLY, label: "Еженедельно" },
  { value: GoalPeriod.MONTHLY, label: "Ежемесячно" },
  { value: GoalPeriod.YEARLY, label: "Ежегодно" },
  { value: GoalPeriod.CUSTOM, label: "Произвольно" },
];

export function GoalForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<GoalType>(GoalType.QUANTITATIVE);
  const [period, setPeriod] = useState<GoalPeriod>(GoalPeriod.DAILY);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);

    startTransition(async () => {
      if (type === GoalType.FINANCIAL) {
        formData.set("metric", GoalMetric.AT_MOST);
      }
      const result = await upsertGoalAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setType(GoalType.QUANTITATIVE);
      setPeriod(GoalPeriod.DAILY);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Новая цель</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Универсальная схема для количественных, бинарных и финансовых целей.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {pending ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Название
          <input
            name="title"
            required
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Описание (опционально)
          <textarea
            name="description"
            rows={2}
            placeholder="Краткое описание цели, контекст или мотивация"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Периодичность
          <select
            name="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Тип цели
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as GoalType)}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Целевое значение
          <div className="flex gap-2">
            <input
              name="target"
              type="number"
              min="0"
              step="0.1"
              placeholder="1, 2, 3..."
              className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-blue-800"
            />
            <input
              name="targetUnit"
              placeholder="ч"
              defaultValue="ч"
              className="h-11 w-20 rounded-lg border border-slate-200 px-3 text-center text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-blue-800"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            💡 Рекомендуем использовать <strong>часы (ч)</strong> для универсального трекинга
          </p>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Дата старта
          <input
            name="startDate"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            По умолчанию - сегодня. Цель появится на странице "Сегодня" с этой даты
          </p>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Дата окончания (опционально)
          <input
            name="endDate"
            type="date"
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
        </label>

        {period === GoalPeriod.CUSTOM && (
          <>
            <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
              Начало диапазона
              <input
                name="customPeriodStart"
                type="date"
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
              Конец диапазона
              <input
                name="customPeriodEnd"
                type="date"
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          XP за выполнение
          <input
            name="xpReward"
            type="number"
            min="0"
            defaultValue={10}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Штраф (мягкий)
          <input
            name="penalty"
            type="number"
            defaultValue={-2}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            name="allowPartial"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 accent-blue-600"
          />
          Разрешить частичное выполнение
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            name="allowNegative"
            type="checkbox"
            className="h-4 w-4 accent-blue-600"
          />
          Разрешить отрицательные значения
        </label>
      </div>
    </form>
  );
}


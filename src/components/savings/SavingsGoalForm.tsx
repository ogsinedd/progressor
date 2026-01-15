"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSavingsGoal } from "@/lib/actions-savings";

export function SavingsGoalForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"GOAL_SAVINGS" | "SINKING_FUND" | "EMERGENCY_FUND">("GOAL_SAVINGS");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);

    startTransition(async () => {
      const result = await createSavingsGoal(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      form.reset();
      router.push("/finances");
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Новая цель накоплений
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Создайте цель для отслеживания накоплений
          </p>
        </div>
       
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Название *
          <input
            name="name"
            required
            placeholder="Например: Отпуск в Европе"
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Тип цели *
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="GOAL_SAVINGS">Накопление</option>
            <option value="SINKING_FUND">Копилка (на трату)</option>
            <option value="EMERGENCY_FUND">Подушка безопасности</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Целевая сумма *
          <div className="flex gap-2">
            <input
              name="targetAmount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="5000.00"
              className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <select
              name="currency"
              defaultValue="EUR"
              className="h-11 w-24 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="RUB">RUB</option>
            </select>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Начальная сумма
          <input
            name="startAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            placeholder="0.00"
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Срок (опционально)
          <input
            name="dueDate"
            type="date"
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Категория
          <select
            name="category"
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">Не выбрана</option>
            <option value="vacation">Отпуск</option>
            <option value="tech">Техника</option>
            <option value="education">Образование</option>
            <option value="home">Дом/Жильё</option>
            <option value="car">Автомобиль</option>
            <option value="emergency">Чрезвычайные ситуации</option>
            <option value="other">Другое</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Описание (опционально)
        <textarea
          name="description"
          rows={2}
          placeholder="Краткое описание цели"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Иконка (опционально)
        <input
          name="icon"
          placeholder="🏖️ (эмодзи)"
          maxLength={10}
          className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </label>
       <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {pending ? "Создаём..." : "Создать"}
        </button>
    </form>
  );
}

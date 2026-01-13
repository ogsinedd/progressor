"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addSavingsEntry } from "@/lib/actions-savings";

type Props = {
  goalId: string;
  goalName: string;
  currency: string;
};

export function SavingsEntryForm({ goalId, goalName, currency }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [source, setSource] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setError("Введите корректную сумму");
      return;
    }

    startTransition(async () => {
      const result = await addSavingsEntry({
        goalId,
        amount: numAmount,
        date: new Date(),
        note: note || undefined,
        source: source || undefined,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      // Очищаем форму
      setAmount("");
      setNote("");
      setSource("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Добавить пополнение
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Цель: {goalName}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Сумма *
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="1000.00"
            className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {currency}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Используйте "+" для пополнения или "-" для снятия
        </p>
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Источник
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
        >
          <option value="">Не указан</option>
          <option value="salary">Зарплата</option>
          <option value="bonus">Бонус</option>
          <option value="freelance">Фриланс</option>
          <option value="gift">Подарок</option>
          <option value="other">Другое</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Заметка
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Опционально"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {pending ? "Сохраняем..." : "Добавить пополнение"}
      </button>
    </form>
  );
}

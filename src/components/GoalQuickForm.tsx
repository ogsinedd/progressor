"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { GoalType } from "@/generated/prisma/enums";
import { upsertEntryAction } from "@/lib/actions";

type Props = {
  goalId: string;
  title: string;
  type: GoalType;
  target?: number | null;
  unit?: string | null;
  defaultValue?: number | null;
  defaultNote?: string | null;
};

export function GoalQuickForm({
  goalId,
  title,
  type,
  target,
  unit,
  defaultValue,
  defaultNote,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState<string>(
    defaultValue !== undefined && defaultValue !== null
      ? String(defaultValue)
      : "",
  );
  const [note, setNote] = useState(defaultNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(nextValue: number) {
    setError(null);
    startTransition(async () => {
      const result = await upsertEntryAction({
        goalId,
        value: nextValue,
        date: new Date(),
        note,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setValue(String(nextValue));
      router.refresh();
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = value === "" ? 0 : Number(value);
    if (Number.isNaN(num)) {
      setError("Введите число");
      return;
    }
    submit(num);
  }

  if (type === GoalType.BINARY) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(1)}
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            Выполнено
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(0)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
          >
            Пропуск
          </button>
        </div>
        <textarea
          name="note"
          placeholder="Заметка (необязательно)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
        />
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }

  // Быстрые кнопки для часов
  const quickButtons = unit === "ч" || unit === "час" || unit === "часов"
    ? [0.25, 0.5, 1, 2, 3]
    : unit === "км"
      ? [1, 3, 5, 10]
      : unit === "страниц" || unit === "стр"
        ? [10, 25, 50, 100]
        : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      {quickButtons ? (
        <>
          {/* Быстрые кнопки */}
          <div className="flex flex-wrap gap-2">
            {quickButtons.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={pending}
                onClick={() => submit(amount)}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                +{amount} {unit}
              </button>
            ))}
          </div>
          
          {/* Кастомный ввод (свернутый) */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
              ⚙️ Другое значение
            </summary>
            <div className="mt-2 flex items-center gap-2">
              <input
                name="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type="number"
                step="0.1"
                min="0"
                placeholder={`Введите ${unit}`}
                className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-blue-800"
              />
              <button
                type="submit"
                disabled={pending}
                className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {pending ? "..." : "✓"}
              </button>
            </div>
          </details>
        </>
      ) : (
        // Обычная форма для других единиц
        <div className="flex items-center gap-2">
          <input
            name="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            step="0.1"
            min="0"
            placeholder={
              target ? `Цель: ${target}${unit ? ` ${unit}` : ""}` : undefined
            }
            className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-blue-800"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {pending ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      )}
      
      <textarea
        name="note"
        placeholder="Заметка (необязательно)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-blue-800"
      />
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </form>
  );
}


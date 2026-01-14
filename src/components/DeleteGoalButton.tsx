"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteGoalAction } from "@/lib/actions";

export function DeleteGoalButton({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            "⚠️ Вы уверены, что хотите УДАЛИТЬ эту цель?\n\nЭто действие необратимо! Все записи и прогресс будут удалены.",
          )
        ) {
          startTransition(async () => {
            await deleteGoalAction(goalId);
            router.refresh();
          });
        }
      }}
      className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60 dark:bg-rose-500 dark:hover:bg-rose-600 cursor-pointer"
    >
      {pending ? "⏳" : "🗑️"} Удалить
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { unarchiveGoalAction } from "@/lib/actions";

type Props = {
  goalId: string;
};

export function UnarchiveGoalButton({ goalId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Разархивировать эту цель?")) return;

    startTransition(async () => {
      await unarchiveGoalAction(goalId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title="Разархивировать цель"
      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600 cursor-pointer"
    >
      {pending ? "Разархивируем..." : "↩️ Разархивировать"}
    </button>
  );
}

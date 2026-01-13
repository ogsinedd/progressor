"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { archiveGoalAction } from "@/lib/actions";

export function ArchiveGoalButton({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Архивировать эту цель? Вы сможете вернуть её позже.")) return;

    startTransition(async () => {
      await archiveGoalAction(goalId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      title="Архивировать цель (можно разархивировать позже)"
      className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
    >
      {pending ? "Архивируем..." : "📦 Архивировать"}
    </button>
  );
}


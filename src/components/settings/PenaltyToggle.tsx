"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { togglePenaltiesAction } from "@/lib/actions";

export function PenaltyToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Штрафы за пропуски
        </p>
        <p className="text-xs text-slate-500">Можно отключить в любой момент.</p>
      </div>
      <input
        type="checkbox"
        className="h-5 w-5 accent-blue-600"
        checked={enabled}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await togglePenaltiesAction(e.target.checked);
            router.refresh();
          })
        }
      />
    </label>
  );
}


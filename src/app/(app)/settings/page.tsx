import { ExportButton } from "@/components/settings/ExportButton";
import { ImportForm } from "@/components/settings/ImportForm";
import { PenaltyToggle } from "@/components/settings/PenaltyToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Управление</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Настройки</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Минимальный набор: экспорты, импорты, штрафы, акцент на данных.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ThemeToggle />

        <PenaltyToggle enabled={user.penaltiesEnabled} />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Аккаунт
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {user.email ?? "Локальный"} · уровень {user.level} · {user.xp} XP
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Экспорт</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Все сущности пользователя в одном JSON (детерминированный дамп).
          </p>
          <div className="mt-3">
            <ExportButton />
          </div>
        </div>

        <ImportForm />
      </div>
    </div>
  );
}


import Link from "next/link";
import { SavingsGoalForm } from "@/components/savings/SavingsGoalForm";
import { requireUser } from "@/lib/auth";

export default async function NewSavingsGoalPage() {
  await requireUser();

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
            Новая цель накоплений
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Создайте цель для отслеживания прогресса
          </p>
        </div>
      </div>

      <SavingsGoalForm />
    </div>
  );
}

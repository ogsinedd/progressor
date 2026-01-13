import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function AchievementsPage() {
  const user = await requireUser();

  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
    orderBy: { unlockedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Мотивация</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Достижения
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Rule-based награды за устойчивый прогресс. История хранится в
            базе, вычисления детерминированы.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Блок готов для rule-based логики (серии, первые успехи, без перерасхода
        и т.п.). Добавьте правила — UI уже готов принимать записи.
      </div>

      <div className="grid gap-3">
        {achievements.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.code}
                </p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.unlockedAt.toLocaleDateString("ru-RU")}
              </p>
            </div>
          </div>
        ))}

        {achievements.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Достижения появятся после добавления правил (например, «7 дней
            подряд», «месяц без перерасхода»). История сохранится автоматически.
          </div>
        )}
      </div>
    </div>
  );
}


import Link from "next/link";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RewardCardWrapper } from "@/components/rewards/RewardCardWrapper";

export default async function RewardsPage() {
  const user = await requireUser();

  const rewards = await prisma.reward.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { priceCoins: "asc" },
  });

  const recentPurchases = await prisma.rewardPurchase.findMany({
    where: { userId: user.id },
    orderBy: { purchasedAt: "desc" },
    take: 10,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Магазин</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            🏆 Награды
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Покупайте награды за монеты
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Ваши монеты</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {user.coins} 🪙
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <RewardCardWrapper
            key={reward.id}
            reward={reward}
            userCoins={user.coins}
            userId={user.id}
          />
        ))}
        {rewards.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Создайте первую награду
            </p>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Мотивируйте себя наградами за достижения. Используйте меню настроек → "Создать награду"
            </p>
          </div>
        )}
      </div>

      {recentPurchases.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            История покупок
          </h2>
          <div className="space-y-2">
            {recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {purchase.rewardName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(purchase.purchasedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  -{purchase.coinsSpent} 🪙
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import type { Reward } from "@/generated/prisma/client";

type Props = {
  reward: Reward;
  userCoins: number;
  onPurchase: () => void;
  isPending?: boolean;
};

export function RewardCard({ reward, userCoins, onPurchase, isPending }: Props) {
  const canAfford = userCoins >= reward.priceCoins;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-start justify-between">
        <div>
          {reward.icon && <span className="text-2xl">{reward.icon}</span>}
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {reward.name}
          </h3>
          {reward.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {reward.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Цена</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {reward.priceCoins} 🪙
          </p>
        </div>
      </div>

      <button
        onClick={onPurchase}
        disabled={!canAfford || isPending}
        className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
          canAfford
            ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
        } disabled:opacity-60`}
      >
        {isPending
          ? "Покупаем..."
          : canAfford
            ? "Купить"
            : `Нужно ещё ${reward.priceCoins - userCoins} монет`}
      </button>
    </div>
  );
}

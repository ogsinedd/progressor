"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RewardCard } from "./RewardCard";
import { purchaseReward } from "@/lib/actions-rewards";
import type { Reward } from "@/generated/prisma/client";

type Props = {
  reward: Reward;
  userCoins: number;
  userId: string;
};

export function RewardCardWrapper({ reward, userCoins }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handlePurchase = () => {
    startTransition(async () => {
      const result = await purchaseReward(reward.id);
      if (result?.ok) {
        router.refresh();
      }
    });
  };

  return (
    <RewardCard
      reward={reward}
      userCoins={userCoins}
      onPurchase={handlePurchase}
      isPending={pending}
    />
  );
}

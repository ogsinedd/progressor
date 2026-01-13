import {
  GoalMetric,
  GoalType,
  type Goal,
} from "@/generated/prisma/client";

import prisma from "./prisma";

const LEVEL_STEP = 100;

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / LEVEL_STEP) + 1);
}

type XpMeta = {
  goalId?: string;
  goalEntryId?: string;
};

export async function applyXpChange(
  userId: string,
  delta: number,
  reason: string,
  meta: XpMeta = {},
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { xp: true, coins: true, penaltiesEnabled: true },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    if (delta < 0 && !user.penaltiesEnabled) {
      return user;
    }

    const nextXp = Math.max(0, user.xp + delta);
    const nextLevel = levelFromXp(nextXp);

    await tx.xpEvent.create({
      data: {
        userId,
        goalId: meta.goalId,
        goalEntryId: meta.goalEntryId,
        delta,
        reason,
      },
    });

    // Конвертация XP → монеты (10 XP = 1 монета)
    const CONVERSION_RATE = 10;
    const coinsToAdd = delta > 0 ? Math.floor(delta / CONVERSION_RATE) : 0;

    return tx.user.update({
      where: { id: userId },
      data: {
        xp: nextXp,
        level: nextLevel,
        coins: coinsToAdd > 0 ? { increment: coinsToAdd } : undefined,
      },
    });
  });
}

export function completionReward(xpReward: number | null | undefined) {
  return xpReward ?? 10;
}

export function penaltyValue(penalty: number | null | undefined) {
  return penalty ?? -2;
}

export function xpForEntry(goal: Goal, value: number | null | undefined) {
  const reward = completionReward(goal.xpReward);
  const penalty = penaltyValue(goal.penalty);

  if (goal.type === GoalType.BINARY) {
    return value && value > 0 ? reward : penalty;
  }

  if (goal.metric === GoalMetric.AT_MOST) {
    const target = goal.target ?? 0;
    if (target === 0) return 0;
    return value !== null && value <= target ? reward : penalty;
  }

  const target = goal.target ?? 0;
  if (target === 0) {
    return value && value > 0 ? reward : 0;
  }

  const ratio = Math.min(Math.max(value ?? 0, 0), target) / target;
  return Math.round(reward * ratio);
}


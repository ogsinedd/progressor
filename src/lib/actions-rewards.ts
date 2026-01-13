'use server';

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { getCurrentUser } from "./auth";
import { rewardSchema } from "./validation-v2";

function getFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value === null || value === "") return undefined;
  return typeof value === "string" ? value : undefined;
}

export async function createReward(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const parsed = rewardSchema.safeParse({
    name: getFormString(formData, "name"),
    description: getFormString(formData, "description"),
    priceCoins: getFormString(formData, "priceCoins"),
    icon: getFormString(formData, "icon"),
    category: getFormString(formData, "category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const reward = await prisma.reward.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      priceCoins: parsed.data.priceCoins,
      icon: parsed.data.icon,
      category: parsed.data.category,
    },
  });

  revalidatePath("/rewards");
  return { ok: true, rewardId: reward.id };
}

export async function updateReward(rewardId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const existing = await prisma.reward.findFirst({
    where: { id: rewardId, userId: user.id },
  });

  if (!existing) return { error: "Награда не найдена" };

  const parsed = rewardSchema.safeParse({
    name: getFormString(formData, "name"),
    description: getFormString(formData, "description"),
    priceCoins: getFormString(formData, "priceCoins"),
    icon: getFormString(formData, "icon"),
    category: getFormString(formData, "category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  await prisma.reward.update({
    where: { id: rewardId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      priceCoins: parsed.data.priceCoins,
      icon: parsed.data.icon,
      category: parsed.data.category,
    },
  });

  revalidatePath("/rewards");
  return { ok: true };
}

export async function deleteReward(rewardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  await prisma.reward.deleteMany({
    where: { id: rewardId, userId: user.id },
  });

  revalidatePath("/rewards");
  return { ok: true };
}

export async function purchaseReward(rewardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  return await prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findFirst({
      where: { id: rewardId, userId: user.id, isActive: true },
    });

    if (!reward) {
      return { error: "Награда не найдена" };
    }

    const currentUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { coins: true },
    });

    if (!currentUser) {
      return { error: "Пользователь не найден" };
    }

    if (currentUser.coins < reward.priceCoins) {
      return { error: `Недостаточно монет (нужно ${reward.priceCoins})` };
    }

    // Создаём покупку
    const purchase = await tx.rewardPurchase.create({
      data: {
        userId: user.id,
        rewardId: reward.id,
        rewardName: reward.name,
        coinsSpent: reward.priceCoins,
      },
    });

    // Списываем монеты
    await tx.user.update({
      where: { id: user.id },
      data: {
        coins: currentUser.coins - reward.priceCoins,
      },
    });

    revalidatePath("/rewards");
    revalidatePath("/settings");

    return {
      ok: true,
      purchase: {
        id: purchase.id,
        rewardName: purchase.rewardName,
        coinsSpent: purchase.coinsSpent,
        coinsRemaining: currentUser.coins - reward.priceCoins,
      },
    };
  });
}

// Конвертация XP → монеты (вызывается при начислении XP)
export async function convertXpToCoins(userId: string, xpDelta: number) {
  if (xpDelta <= 0) return; // Конвертируем только положительный XP

  const CONVERSION_RATE = 10; // 10 XP = 1 монета
  const coinsToAdd = Math.floor(xpDelta / CONVERSION_RATE);

  if (coinsToAdd > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: {
          increment: coinsToAdd,
        },
      },
    });
  }
}

'use server';

import { revalidatePath } from "next/cache";
import { startOfWeek, endOfWeek, addDays } from "date-fns";
import prisma from "./prisma";
import { getCurrentUser } from "./auth";
import {
  streakFreezeSchema,
  weeklyPlanSchema,
  weeklyReviewSchema,
} from "./validation-v2";
import { getWeeklyScore } from "./weekly-score";

// ===== STREAK FREEZE =====

export async function applyStreakFreeze(
  goalId: string,
  freezeDate: Date,
  reason?: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const parsed = streakFreezeSchema.safeParse({
    goalId,
    freezeDate,
    reason,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  // Проверяем, что цель принадлежит пользователю
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: user.id },
  });

  if (!goal) return { error: "Цель не найдена" };

  // Проверяем лимит freeze в текущем месяце
  const monthStart = new Date(
    freezeDate.getFullYear(),
    freezeDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    freezeDate.getFullYear(),
    freezeDate.getMonth() + 1,
    0
  );

  const freezesThisMonth = await prisma.streakFreeze.count({
    where: {
      goalId,
      freezeDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  if (freezesThisMonth >= user.freezeLimitPerMonth) {
    return {
      error: `Превышен лимит заморозок (${user.freezeLimitPerMonth} в месяц)`,
    };
  }

  // Проверяем, нет ли уже freeze на эту дату
  const existing = await prisma.streakFreeze.findUnique({
    where: {
      goalId_freezeDate: {
        goalId,
        freezeDate: parsed.data.freezeDate,
      },
    },
  });

  if (existing) {
    return { error: "Эта дата уже заморожена" };
  }

  // Создаём freeze
  const freeze = await prisma.streakFreeze.create({
    data: {
      goalId,
      userId: user.id,
      freezeDate: parsed.data.freezeDate,
      reason: parsed.data.reason,
    },
  });

  revalidatePath("/today");
  revalidatePath("/goals");

  return {
    ok: true,
    freezeId: freeze.id,
    freezesUsedThisMonth: freezesThisMonth + 1,
    freezesRemaining: user.freezeLimitPerMonth - (freezesThisMonth + 1),
  };
}

export async function getFreezesStatus(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const freezesThisMonth = await prisma.streakFreeze.findMany({
    where: {
      goalId,
      userId: user.id,
      freezeDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    orderBy: { freezeDate: "desc" },
  });

  return {
    goalId,
    currentMonth: now.toISOString().substring(0, 7),
    freezesUsed: freezesThisMonth.length,
    freezesLimit: user.freezeLimitPerMonth,
    freezesRemaining: user.freezeLimitPerMonth - freezesThisMonth.length,
    freezeHistory: freezesThisMonth.map((f) => ({
      date: f.freezeDate,
      reason: f.reason,
    })),
  };
}

// ===== WEEKLY PLANS =====

export async function createWeeklyPlan(
  weekStartDate: Date,
  focusSpheres: Array<{ sphere: string; plan: string }>
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const parsed = weeklyPlanSchema.safeParse({
    weekStartDate,
    focusSpheres,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const weekStart = startOfWeek(parsed.data.weekStartDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(parsed.data.weekStartDate, { weekStartsOn: 1 });

  // Проверяем, нет ли уже плана на эту неделю
  const existing = await prisma.weeklyPlan.findUnique({
    where: {
      userId_weekStartDate: {
        userId: user.id,
        weekStartDate: weekStart,
      },
    },
  });

  if (existing) {
    return { error: "План на эту неделю уже существует" };
  }

  const plan = await prisma.weeklyPlan.create({
    data: {
      userId: user.id,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      focusSpheres: parsed.data.focusSpheres,
    },
  });

  revalidatePath("/weekly-plan");
  return { ok: true, planId: plan.id };
}

export async function addWeeklyReview(planId: string, answers: any[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const parsed = weeklyReviewSchema.safeParse({
    planId,
    reviewAnswers: answers,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const plan = await prisma.weeklyPlan.findFirst({
    where: { id: planId, userId: user.id },
  });

  if (!plan) return { error: "План не найден" };

  if (plan.isCompleted) {
    return { error: "Review уже создан" };
  }

  // Генерируем авто-сводку
  const focusSpheres = (plan.focusSpheres as any[]) || [];
  const autoSummary: Record<string, any> = {};

  for (const focus of focusSpheres) {
    const sphere = focus.sphere;
    
    // Получаем weekly score для этой сферы
    const scoreResult = await getWeeklyScore(user.id, "week");
    const sphereScore = scoreResult.scores[sphere];

    if (sphereScore) {
      autoSummary[sphere] = {
        score: sphereScore.score,
        trend: sphereScore.trend,
        completedGoals: sphereScore.goals.filter((g) => g.score >= 100).length,
        totalGoals: sphereScore.goals.length,
      };
    }
  }

  // Обновляем план
  await prisma.weeklyPlan.update({
    where: { id: planId },
    data: {
      reviewAnswers: parsed.data.reviewAnswers,
      autoSummary,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  revalidatePath("/weekly-plan");
  return { ok: true, autoSummary };
}

export async function getCurrentWeekPlan() {
  const user = await getCurrentUser();
  if (!user) return null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const plan = await prisma.weeklyPlan.findUnique({
    where: {
      userId_weekStartDate: {
        userId: user.id,
        weekStartDate: weekStart,
      },
    },
  });

  return plan;
}

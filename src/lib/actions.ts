'use server';

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  GoalMetric,
  GoalPeriod,
  GoalType,
  type Goal,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

import { getCurrentUser } from "./auth";
import { findEntryForDate } from "./progress";
import { entrySchema, goalSchema, registerSchema } from "./validation";
import { applyXpChange, xpForEntry } from "./xp";
import { checkAndAwardAchievements } from "./achievements";

// Helper to convert null/empty FormData values to undefined
function getFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value === null || value === "") return undefined;
  return typeof value === "string" ? value : undefined;
}

export async function registerUserAction(
  prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = registerSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    name: getFormString(formData, "name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Пользователь уже существует" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
    },
  });

  redirect("/login?registered=1");
}

export async function upsertGoalAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Требуется авторизация" };
  }

  const parsed = goalSchema.safeParse({
    id: getFormString(formData, "id"),
    title: getFormString(formData, "title"),
    description: getFormString(formData, "description"),
    type: getFormString(formData, "type"),
    period: getFormString(formData, "period"),
    metric: getFormString(formData, "metric") ?? GoalMetric.AT_LEAST,
    target: getFormString(formData, "target"),
    targetUnit: getFormString(formData, "targetUnit"),
    startDate: getFormString(formData, "startDate") ?? new Date(),
    endDate: getFormString(formData, "endDate"),
    customPeriodStart: getFormString(formData, "customPeriodStart"),
    customPeriodEnd: getFormString(formData, "customPeriodEnd"),
    xpReward: getFormString(formData, "xpReward") ?? 10,
    penalty: getFormString(formData, "penalty") ?? -2,
    allowPartial: formData.get("allowPartial") === "on",
    allowNegative: formData.get("allowNegative") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const data = parsed.data;
  const metric =
    data.type === GoalType.FINANCIAL ? GoalMetric.AT_MOST : data.metric;

  if (
    data.endDate &&
    data.startDate &&
    data.endDate.getTime() < data.startDate.getTime()
  ) {
    return { error: "Дата окончания не может быть раньше начала" };
  }

  await prisma.goal.upsert({
    where: { id: data.id ?? "" },
    create: {
      userId: user.id,
      title: data.title,
      description: data.description,
      type: data.type,
      period: data.period,
      metric,
      target: data.target ?? null,
      targetUnit: data.targetUnit,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      customPeriodStart:
        data.period === GoalPeriod.CUSTOM ? data.customPeriodStart : null,
      customPeriodEnd:
        data.period === GoalPeriod.CUSTOM ? data.customPeriodEnd : null,
      xpReward: data.xpReward ?? 10,
      penalty: data.penalty ?? -2,
      allowPartial: data.allowPartial ?? true,
      allowNegative: data.allowNegative ?? false,
    },
    update: {
      title: data.title,
      description: data.description,
      type: data.type,
      period: data.period,
      metric,
      target: data.target ?? null,
      targetUnit: data.targetUnit,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      customPeriodStart:
        data.period === GoalPeriod.CUSTOM ? data.customPeriodStart : null,
      customPeriodEnd:
        data.period === GoalPeriod.CUSTOM ? data.customPeriodEnd : null,
      xpReward: data.xpReward ?? 10,
      penalty: data.penalty ?? -2,
      allowPartial: data.allowPartial ?? true,
      allowNegative: data.allowNegative ?? false,
    },
  });

  // Проверяем достижения после создания/обновления цели
  await checkAndAwardAchievements(user.id).catch(console.error);

  revalidateAll();
  return { ok: true };
}

export async function archiveGoalAction(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  await prisma.goal.updateMany({
    where: { id: goalId, userId: user.id },
    data: { archived: true },
  });

  revalidateAll();
  return { ok: true };
}

export async function unarchiveGoalAction(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  await prisma.goal.updateMany({
    where: { id: goalId, userId: user.id },
    data: { archived: false },
  });

  revalidateAll();
  return { ok: true };
}

export async function deleteGoalAction(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  // Проверяем что цель принадлежит пользователю
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { userId: true },
  });

  if (!goal || goal.userId !== user.id) {
    return { error: "Цель не найдена" };
  }

  // Удаляем все записи цели, затем саму цель
  await prisma.goalEntry.deleteMany({
    where: { goalId },
  });

  await prisma.goal.delete({
    where: { id: goalId },
  });

  revalidateAll();
  return { ok: true };
}

type EntryInput = {
  goalId: string;
  value: number | null;
  date?: string | Date;
  note?: string | null;
};

export async function upsertEntryAction(input: EntryInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const parsed = entrySchema.safeParse({
    goalId: input.goalId,
    value: input.value,
    date: input.date ?? new Date(),
    note: input.note,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const goal = await prisma.goal.findFirst({
    where: { id: parsed.data.goalId, userId: user.id, archived: false },
    include: { entries: true },
  });
  if (!goal) return { error: "Цель не найдена" };

  const normalizedValue =
    goal.type === GoalType.BINARY
      ? parsed.data.value && parsed.data.value > 0
        ? 1
        : 0
      : parsed.data.value ?? 0;

  if (!goal.allowNegative && normalizedValue < 0) {
    return { error: "Нельзя вводить отрицательное значение" };
  }

  const existing = findEntryForDate(goal.entries, parsed.data.date);
  const previousXp = existing ? xpForEntry(goal as Goal, existing.value) : 0;
  const nextXp = xpForEntry(goal as Goal, normalizedValue);
  const xpDelta = nextXp - previousXp;

  const entry = await prisma.goalEntry.upsert({
    where: {
      goalId_date: {
        goalId: goal.id,
        date: parsed.data.date,
      },
    },
    create: {
      goalId: goal.id,
      date: parsed.data.date,
      value: normalizedValue,
      note: parsed.data.note,
    },
    update: {
      value: normalizedValue,
      note: parsed.data.note,
    },
  });

  if (xpDelta !== 0) {
    await applyXpChange(user.id, xpDelta, `Обновление цели "${goal.title}"`, {
      goalId: goal.id,
      goalEntryId: entry.id,
    });
  }

  // Проверяем достижения после внесения записи
  await checkAndAwardAchievements(user.id).catch(console.error);

  revalidateAll();
  return { ok: true };
}

export async function togglePenaltiesAction(enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  await prisma.user.update({
    where: { id: user.id },
    data: { penaltiesEnabled: enabled },
  });

  revalidateAll();
  return { ok: true };
}

function revalidateAll() {
  revalidatePath("/today");
  revalidatePath("/goals");
  revalidatePath("/stats");
  revalidatePath("/achievements");
  revalidatePath("/settings");
}


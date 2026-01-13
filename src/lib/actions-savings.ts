'use server';

import { revalidatePath } from "next/cache";
import { SavingsGoalType } from "@/generated/prisma/enums";
import prisma from "./prisma";
import { getCurrentUser } from "./auth";
import { savingsGoalSchema, savingsEntrySchema } from "./validation-v2";

// Helper для FormData
function getFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value === null || value === "") return undefined;
  return typeof value === "string" ? value : undefined;
}

export async function createSavingsGoal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const parsed = savingsGoalSchema.safeParse({
    name: getFormString(formData, "name"),
    type: getFormString(formData, "type") as SavingsGoalType,
    targetAmount: getFormString(formData, "targetAmount"),
    currency: getFormString(formData, "currency") || "EUR",
    startAmount: getFormString(formData, "startAmount") || 0,
    dueDate: getFormString(formData, "dueDate"),
    category: getFormString(formData, "category"),
    description: getFormString(formData, "description"),
    icon: getFormString(formData, "icon"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      targetAmount: parsed.data.targetAmount,
      currency: parsed.data.currency,
      startAmount: parsed.data.startAmount,
      dueDate: parsed.data.dueDate ?? null,
      category: parsed.data.category,
      description: parsed.data.description,
      icon: parsed.data.icon,
    },
  });

  revalidateSavings();
  return { ok: true, goalId: goal.id };
}

export async function updateSavingsGoal(goalId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const existing = await prisma.savingsGoal.findFirst({
    where: { id: goalId, userId: user.id },
  });

  if (!existing) return { error: "Цель не найдена" };

  const parsed = savingsGoalSchema.safeParse({
    name: getFormString(formData, "name"),
    type: getFormString(formData, "type") as SavingsGoalType,
    targetAmount: getFormString(formData, "targetAmount"),
    currency: getFormString(formData, "currency"),
    startAmount: getFormString(formData, "startAmount"),
    dueDate: getFormString(formData, "dueDate"),
    category: getFormString(formData, "category"),
    description: getFormString(formData, "description"),
    icon: getFormString(formData, "icon"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      targetAmount: parsed.data.targetAmount,
      currency: parsed.data.currency,
      startAmount: parsed.data.startAmount,
      dueDate: parsed.data.dueDate ?? null,
      category: parsed.data.category,
      description: parsed.data.description,
      icon: parsed.data.icon,
    },
  });

  revalidateSavings();
  return { ok: true };
}

export async function archiveSavingsGoal(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  await prisma.savingsGoal.updateMany({
    where: { id: goalId, userId: user.id },
    data: { archived: true, isActive: false },
  });

  revalidateSavings();
  return { ok: true };
}

export async function deleteSavingsGoal(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  await prisma.savingsGoal.deleteMany({
    where: { id: goalId, userId: user.id },
  });

  revalidateSavings();
  return { ok: true };
}

type AddEntryInput = {
  goalId: string;
  amount: number;
  date?: Date | string;
  note?: string;
  source?: string;
};

export async function addSavingsEntry(input: AddEntryInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  const parsed = savingsEntrySchema.safeParse({
    goalId: input.goalId,
    amount: input.amount,
    date: input.date ?? new Date(),
    note: input.note,
    source: input.source,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const goal = await prisma.savingsGoal.findFirst({
    where: { id: parsed.data.goalId, userId: user.id, archived: false },
  });

  if (!goal) return { error: "Цель не найдена" };

  const entry = await prisma.savingsEntry.upsert({
    where: {
      goalId_date: {
        goalId: goal.id,
        date: parsed.data.date,
      },
    },
    create: {
      goalId: goal.id,
      userId: user.id,
      date: parsed.data.date,
      amount: parsed.data.amount,
      note: parsed.data.note,
      source: parsed.data.source,
    },
    update: {
      amount: parsed.data.amount,
      note: parsed.data.note,
      source: parsed.data.source,
    },
  });

  revalidateSavings();
  return { ok: true, entryId: entry.id };
}

export async function deleteSavingsEntry(entryId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация" };

  await prisma.savingsEntry.deleteMany({
    where: { id: entryId, userId: user.id },
  });

  revalidateSavings();
  return { ok: true };
}

function revalidateSavings() {
  revalidatePath("/finances");
  revalidatePath("/finances/goals");
  revalidatePath("/today");
}

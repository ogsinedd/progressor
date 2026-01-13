import { z } from "zod";

// ===== SAVINGS (ФИНАНСЫ) =====

export const savingsGoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Название обязательно").max(120),
  type: z.enum(["GOAL_SAVINGS", "SINKING_FUND", "EMERGENCY_FUND"], {
    errorMap: () => ({ message: "Выберите тип цели" }),
  }),
  targetAmount: z.coerce
    .number()
    .min(0, "Целевая сумма не может быть отрицательной"),
  currency: z.string().max(3).default("EUR"),
  startAmount: z.coerce.number().default(0),
  dueDate: z.coerce.date().optional(),
  category: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export const savingsEntrySchema = z.object({
  goalId: z.string(),
  date: z.coerce.date(),
  amount: z.coerce.number(), // может быть отрицательным (снятие)
  note: z.string().max(240).optional(),
  source: z.string().max(50).optional(),
});

// ===== REWARDS (НАГРАДЫ) =====

export const rewardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Название обязательно").max(120),
  description: z.string().max(500).optional(),
  priceCoins: z.coerce.number().int().min(1, "Цена должна быть положительной"),
  icon: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
});

// ===== GOAL PRESETS (ШАБЛОНЫ) =====

export const goalPresetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Название обязательно").max(120),
  category: z.string().min(1, "Категория обязательна").max(50),
  presetData: z.object({
    type: z.enum(["QUANTITATIVE", "BINARY", "FINANCIAL"]),
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
    metric: z.enum(["AT_LEAST", "AT_MOST"]).optional(),
    target: z.number().optional(),
    targetUnit: z.string().max(32).optional(),
    xpReward: z.number().int().default(10),
    penalty: z.number().int().default(-2),
    allowPartial: z.boolean().default(true),
    allowNegative: z.boolean().default(false),
  }),
});

// ===== WEEKLY PLANS (ПЛАНЫ НЕДЕЛИ) =====

export const weeklyPlanSchema = z.object({
  weekStartDate: z.coerce.date(),
  focusSpheres: z
    .array(
      z.object({
        sphere: z.string().min(1, "Выберите сферу"),
        plan: z.string().min(1, "Напишите план").max(500),
      })
    )
    .min(1, "Выберите минимум 1 фокус-сферу")
    .max(3, "Максимум 3 фокус-сферы"),
});

export const weeklyReviewSchema = z.object({
  planId: z.string(),
  reviewAnswers: z.array(
    z.object({
      question: z.string(),
      answer: z.string().min(1, "Ответ обязателен").max(500),
    })
  ),
});

// ===== STREAK FREEZE =====

export const streakFreezeSchema = z.object({
  goalId: z.string(),
  freezeDate: z.coerce.date(),
  reason: z.string().max(140).optional(),
});

// ===== QUESTS =====

export const questSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Название обязательно").max(120),
  description: z.string().max(500).optional(),
  goalIds: z.array(z.string()).min(1, "Выберите минимум 1 цель"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rewardXp: z.coerce.number().int().min(0).default(0),
  rewardCoins: z.coerce.number().int().min(0).default(0),
  rewardAchievementCode: z.string().max(50).optional(),
});

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
export type SavingsEntryInput = z.infer<typeof savingsEntrySchema>;
export type RewardInput = z.infer<typeof rewardSchema>;
export type GoalPresetInput = z.infer<typeof goalPresetSchema>;
export type WeeklyPlanInput = z.infer<typeof weeklyPlanSchema>;
export type WeeklyReviewInput = z.infer<typeof weeklyReviewSchema>;
export type StreakFreezeInput = z.infer<typeof streakFreezeSchema>;
export type QuestInput = z.infer<typeof questSchema>;

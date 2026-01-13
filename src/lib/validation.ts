import { z } from "zod";

import { GoalMetric, GoalPeriod, GoalType } from "@/generated/prisma/enums";

export const registerSchema = z.object({
  email: z.string().email({ message: "Введите корректный email" }),
  password: z
    .string()
    .min(6, "Пароль должен быть не короче 6 символов")
    .max(100),
  name: z.string().max(64).optional(),
});

export const goalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Название обязательно").max(120),
  description: z.string().max(240).optional(),
  type: z.nativeEnum(GoalType),
  period: z.nativeEnum(GoalPeriod),
  metric: z.nativeEnum(GoalMetric).default(GoalMetric.AT_LEAST),
  target: z.coerce.number().min(0, "Цель не может быть отрицательной").optional(),
  targetUnit: z.string().max(32).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  customPeriodStart: z.coerce.date().optional(),
  customPeriodEnd: z.coerce.date().optional(),
  xpReward: z.coerce.number().int().default(10),
  penalty: z.coerce.number().int().default(-2),
  allowPartial: z.coerce.boolean().default(true),
  allowNegative: z.coerce.boolean().default(false),
});

export const entrySchema = z.object({
  goalId: z.string(),
  value: z.coerce.number().nullable().optional(),
  date: z.coerce.date(),
  note: z.string().max(240).optional(),
});


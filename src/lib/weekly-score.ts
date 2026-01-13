import {
  addDays,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import type { Goal, GoalEntry } from "@/generated/prisma/client";
import { GoalType, GoalMetric } from "@/generated/prisma/enums";
import prisma from "./prisma";

export type Period = {
  start: Date;
  end: Date;
};

export type GoalScore = {
  goalId: string;
  name: string;
  score: number;
  progress: number;
  target: number;
};

export type SphereScore = {
  sphere: string;
  score: number;
  goals: GoalScore[];
  trend: "up" | "down" | "stable";
};

export type WeeklyScoreResult = {
  period: Period;
  scores: Record<string, SphereScore>;
  overall: number;
};

/**
 * Получить период по типу
 */
export function getPeriod(
  periodType: "week" | "month" | "year" | "custom",
  customStart?: Date,
  customEnd?: Date
): Period {
  const now = new Date();
  
  switch (periodType) {
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case "year":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case "custom":
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      // Fallback to week
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
  }
}

/**
 * Получить предыдущий период той же длины
 */
export function getPreviousPeriod(period: Period): Period {
  const days = differenceInDays(period.end, period.start);
  return {
    start: addDays(period.start, -(days + 1)),
    end: addDays(period.start, -1),
  };
}

/**
 * Вычислить score для одной цели (0-100)
 */
export function calculateGoalScore(
  goal: Goal & { entries: GoalEntry[] },
  period: Period
): number {
  // Фильтруем entries в период
  const entries = goal.entries.filter(
    (e) => e.date >= period.start && e.date <= period.end
  );

  if (goal.type === GoalType.BINARY) {
    // Бинарная: done / total дней
    const totalDays = differenceInDays(period.end, period.start) + 1;
    const doneDays = entries.filter((e) => (e.value ?? 0) > 0).length;
    return (doneDays / totalDays) * 100;
  }

  if (goal.type === GoalType.QUANTITATIVE) {
    // Количественная: fact / plan
    const fact = entries.reduce((sum, e) => sum + (e.value ?? 0), 0);
    const plan = calculatePlanForPeriod(goal, period);

    if (plan === 0) {
      // Если нет плана, любой прогресс = 100%
      return fact > 0 ? 100 : 0;
    }

    return Math.min((fact / plan) * 100, 100);
  }

  if (goal.type === GoalType.FINANCIAL) {
    if (goal.metric === GoalMetric.AT_MOST) {
      // Лимит: (limit - spent) / limit * 100
      const spent = entries.reduce((sum, e) => sum + (e.value ?? 0), 0);
      const limit = goal.target ?? 0;

      if (limit === 0) return 0;

      const remaining = Math.max(limit - spent, 0);
      return (remaining / limit) * 100;
    }
  }

  return 0;
}

/**
 * Вычислить план для периода (для количественных целей)
 */
function calculatePlanForPeriod(goal: Goal, period: Period): number {
  const days = differenceInDays(period.end, period.start) + 1;
  const target = goal.target ?? 0;

  switch (goal.period) {
    case "DAILY":
      return target * days;
    case "WEEKLY":
      const weeks = Math.ceil(days / 7);
      return target * weeks;
    case "MONTHLY":
      const months = Math.ceil(days / 30.44);
      return target * months;
    case "YEARLY":
      const years = Math.ceil(days / 365.25);
      return target * years;
    case "CUSTOM":
      // Для кастомных используем target напрямую
      return target;
    default:
      return target;
  }
}

/**
 * Вычислить score для сферы (средний по целям)
 */
export function calculateSphereScore(
  goals: (Goal & { entries: GoalEntry[] })[],
  period: Period
): { score: number; goalScores: GoalScore[] } {
  if (goals.length === 0) {
    return { score: 0, goalScores: [] };
  }

  const goalScores: GoalScore[] = goals.map((goal) => {
    const score = calculateGoalScore(goal, period);
    const entries = goal.entries.filter(
      (e) => e.date >= period.start && e.date <= period.end
    );
    const progress = entries.reduce((sum, e) => sum + (e.value ?? 0), 0);

    return {
      goalId: goal.id,
      name: goal.title,
      score: Math.round(score * 10) / 10,
      progress: Math.round(progress * 10) / 10,
      target: goal.target ?? 0,
    };
  });

  const averageScore =
    goalScores.reduce((sum, gs) => sum + gs.score, 0) / goalScores.length;

  return {
    score: Math.round(averageScore * 10) / 10,
    goalScores,
  };
}

/**
 * Вычислить тренд (сравнение с предыдущим периодом)
 */
export function calculateTrend(
  currentScore: number,
  previousScore: number
): "up" | "down" | "stable" {
  const diff = currentScore - previousScore;
  const threshold = 5; // 5% разница считается значимой

  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "stable";
}

/**
 * Получить weekly score по всем сферам
 */
export async function getWeeklyScore(
  userId: string,
  periodType: "week" | "month" | "year" | "custom" = "week",
  customStart?: Date,
  customEnd?: Date
): Promise<WeeklyScoreResult> {
  const period = getPeriod(periodType, customStart, customEnd);
  const previousPeriod = getPreviousPeriod(period);

  // Получаем все активные цели с entries
  const goals = await prisma.goal.findMany({
    where: {
      userId,
      archived: false,
      startDate: { lte: period.end },
      OR: [{ endDate: null }, { endDate: { gte: period.start } }],
    },
    include: {
      entries: {
        where: {
          date: { gte: previousPeriod.start, lte: period.end },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  // Группируем по сферам (категориям)
  const spheres = [
    "yoga",
    "fitness",
    "programming",
    "reading",
    "nutrition",
    "finance",
  ];
  
  const scores: Record<string, SphereScore> = {};
  
  for (const sphere of spheres) {
    const sphereGoals = goals.filter((g) => g.category === sphere);

    if (sphereGoals.length > 0) {
      const { score, goalScores } = calculateSphereScore(sphereGoals, period);

      // Вычисляем score для предыдущего периода
      const { score: previousScore } = calculateSphereScore(
        sphereGoals,
        previousPeriod
      );

      const trend = calculateTrend(score, previousScore);

      scores[sphere] = {
        sphere,
        score,
        goals: goalScores,
        trend,
      };
    } else {
      scores[sphere] = {
        sphere,
        score: 0,
        goals: [],
        trend: "stable",
      };
    }
  }

  // Общий score (среднее по всем сферам)
  const sphereValues = Object.values(scores).filter((s) => s.goals.length > 0);
  const overall =
    sphereValues.length > 0
      ? sphereValues.reduce((sum, s) => sum + s.score, 0) / sphereValues.length
      : 0;

  return {
    period,
    scores,
    overall: Math.round(overall * 10) / 10,
  };
}

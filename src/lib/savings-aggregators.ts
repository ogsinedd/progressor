import { addDays, addMonths, differenceInDays, startOfMonth } from "date-fns";
import type { SavingsGoal, SavingsEntry } from "@/generated/prisma/client";
import prisma from "./prisma";
import { normalizeDate } from "./date";

export type TimeSeriesPoint = {
  date: string;
  total: number;
};

export type MonthlyContribution = {
  month: string;
  amount: number;
};

export type GoalProjection = {
  estimatedDate: Date | null;
  averageMonthly: number;
  daysRemaining: number | null;
};

/**
 * Получить историю общих накоплений за период
 */
export async function getTotalSavingsOverTime(
  userId: string,
  days: number = 30
): Promise<{ data: TimeSeriesPoint[]; growth: number; growthPercent: number }> {
  const endDate = new Date();
  const startDate = addDays(endDate, -days);

  // Получаем все цели пользователя
  const goals = await prisma.savingsGoal.findMany({
    where: { userId, isActive: true, archived: false },
    include: {
      entries: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  // Вычисляем начальный баланс (до startDate)
  let initialTotal = 0;
  for (const goal of goals) {
    initialTotal += goal.startAmount;
    
    const earlyEntries = await prisma.savingsEntry.findMany({
      where: {
        goalId: goal.id,
        date: { lt: startDate },
      },
    });
    
    initialTotal += earlyEntries.reduce((sum, e) => sum + e.amount, 0);
  }

  // Собираем все entries в период
  const allEntries = goals.flatMap((g) => g.entries);
  
  // Группируем по датам
  const entriesByDate: Record<string, number> = {};
  allEntries.forEach((entry) => {
    const dateKey = normalizeDate(entry.date).toISOString().split("T")[0];
    entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + entry.amount;
  });

  // Строим time series
  const result: TimeSeriesPoint[] = [];
  let runningTotal = initialTotal;

  for (let i = 0; i <= days; i++) {
    const currentDate = addDays(startDate, i);
    const dateKey = normalizeDate(currentDate).toISOString().split("T")[0];

    if (entriesByDate[dateKey]) {
      runningTotal += entriesByDate[dateKey];
    }

    result.push({
      date: dateKey,
      total: Math.round(runningTotal * 100) / 100,
    });
  }

  // Вычисляем рост
  const firstTotal = result[0]?.total || 0;
  const lastTotal = result[result.length - 1]?.total || 0;
  const growth = lastTotal - firstTotal;
  const growthPercent = firstTotal > 0 ? (growth / firstTotal) * 100 : 0;

  return {
    data: result,
    growth: Math.round(growth * 100) / 100,
    growthPercent: Math.round(growthPercent * 10) / 10,
  };
}

/**
 * Получить месячные взносы за последние N месяцев
 */
export async function getMonthlyContributions(
  userId: string,
  months: number = 12
): Promise<{
  data: MonthlyContribution[];
  averageMonthly: number;
  totalYear: number;
}> {
  const endDate = new Date();
  const startDate = addMonths(endDate, -months);

  const entries = await prisma.savingsEntry.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      amount: { gt: 0 }, // Только пополнения, не снятия
    },
    orderBy: { date: "asc" },
  });

  // Группируем по месяцам
  const entriesByMonth: Record<string, number> = {};
  entries.forEach((entry) => {
    const monthKey = normalizeDate(entry.date).toISOString().substring(0, 7); // YYYY-MM
    entriesByMonth[monthKey] = (entriesByMonth[monthKey] || 0) + entry.amount;
  });

  // Строим результат для всех месяцев (включая пустые)
  const result: MonthlyContribution[] = [];
  for (let i = 0; i < months; i++) {
    const monthDate = addMonths(startOfMonth(startDate), i);
    const monthKey = monthDate.toISOString().substring(0, 7);
    
    result.push({
      month: monthKey,
      amount: Math.round((entriesByMonth[monthKey] || 0) * 100) / 100,
    });
  }

  const totalYear = result.reduce((sum, m) => sum + m.amount, 0);
  const averageMonthly = totalYear / months;

  return {
    data: result,
    averageMonthly: Math.round(averageMonthly * 100) / 100,
    totalYear: Math.round(totalYear * 100) / 100,
  };
}

/**
 * Получить текущий баланс цели
 */
export function calculateGoalBalance(
  goal: SavingsGoal & { entries: SavingsEntry[] }
): number {
  const entriesSum = goal.entries.reduce((sum, e) => sum + e.amount, 0);
  return Math.round((goal.startAmount + entriesSum) * 100) / 100;
}

/**
 * Получить прогресс цели (0-100%)
 */
export function calculateGoalProgress(
  goal: SavingsGoal & { entries: SavingsEntry[] }
): number {
  const currentAmount = calculateGoalBalance(goal);
  if (goal.targetAmount === 0) return 0;
  return Math.min((currentAmount / goal.targetAmount) * 100, 100);
}

/**
 * Прогноз достижения цели (линейная регрессия)
 */
export function projectGoalCompletion(
  goal: SavingsGoal & { entries: SavingsEntry[] }
): GoalProjection | null {
  // Фильтруем только пополнения
  const contributions = goal.entries.filter((e) => e.amount > 0);

  // Нужно минимум 5 пополнений
  if (contributions.length < 5) return null;

  // Сортируем по дате
  contributions.sort((a, b) => a.date.getTime() - b.date.getTime());

  const firstDate = contributions[0].date;
  const lastDate = contributions[contributions.length - 1].date;
  const daysElapsed = differenceInDays(lastDate, firstDate) || 1;
  const monthsElapsed = daysElapsed / 30.44 || 1; // Средний месяц

  const totalContributed = contributions.reduce((sum, e) => sum + e.amount, 0);
  const averageMonthly = totalContributed / monthsElapsed;

  const currentAmount = calculateGoalBalance(goal);
  const remaining = goal.targetAmount - currentAmount;

  if (remaining <= 0) {
    return {
      estimatedDate: new Date(),
      averageMonthly: Math.round(averageMonthly * 100) / 100,
      daysRemaining: 0,
    };
  }

  if (averageMonthly === 0) return null;

  const monthsNeeded = remaining / averageMonthly;
  const daysNeeded = Math.ceil(monthsNeeded * 30.44);
  const estimatedDate = addDays(new Date(), daysNeeded);

  return {
    estimatedDate,
    averageMonthly: Math.round(averageMonthly * 100) / 100,
    daysRemaining: daysNeeded,
  };
}

/**
 * Получить детальный прогресс цели со всеми метриками
 */
export async function getGoalProgressDetails(goalId: string) {
  const goal = await prisma.savingsGoal.findUnique({
    where: { id: goalId },
    include: {
      entries: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!goal) return null;

  const currentAmount = calculateGoalBalance(goal);
  const progress = calculateGoalProgress(goal);
  const projection = projectGoalCompletion(goal);

  return {
    goal: {
      ...goal,
      currentAmount,
      progress: Math.round(progress * 10) / 10,
    },
    entries: goal.entries,
    projection,
  };
}

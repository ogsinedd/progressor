'use server';

import { type Goal, GoalType, type GoalEntry } from "@/generated/prisma/client";
import prisma from "./prisma";
import { normalizeDate } from "./date";

type AchievementRule = {
  code: string;
  title: string;
  description: string;
  check: (context: AchievementContext) => Promise<boolean>;
};

type AchievementContext = {
  userId: string;
  goals: (Goal & { entries: GoalEntry[] })[];
  allEntries: GoalEntry[];
};

// Правила для достижений
const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    code: "FIRST_GOAL",
    title: "Первый шаг",
    description: "Создана первая цель",
    check: async (ctx) => ctx.goals.length >= 1,
  },
  {
    code: "FIRST_ENTRY",
    title: "Первая запись",
    description: "Внесен первый прогресс",
    check: async (ctx) => ctx.allEntries.length >= 1,
  },
  {
    code: "STREAK_7_DAYS",
    title: "Неделя побед",
    description: "7 дней подряд выполнения любой цели",
    check: async (ctx) => {
      const streak = await calculateMaxStreak(ctx.allEntries);
      return streak >= 7;
    },
  },
  {
    code: "STREAK_30_DAYS",
    title: "Месяц дисциплины",
    description: "30 дней подряд выполнения целей",
    check: async (ctx) => {
      const streak = await calculateMaxStreak(ctx.allEntries);
      return streak >= 30;
    },
  },
  {
    code: "GOAL_COMPLETED",
    title: "Первое достижение",
    description: "Завершена первая цель на 100%",
    check: async (ctx) => {
      // Проверяем, есть ли хотя бы одна цель с 100% прогрессом
      for (const goal of ctx.goals) {
        if (goal.type === GoalType.BINARY) {
          const hasCompleted = goal.entries.some(e => (e.value ?? 0) > 0);
          if (hasCompleted) return true;
        } else if (goal.target && goal.target > 0) {
          const sum = goal.entries.reduce((acc, e) => acc + (e.value ?? 0), 0);
          if (sum >= goal.target) return true;
        }
      }
      return false;
    },
  },
  {
    code: "NO_OVERSPEND_MONTH",
    title: "Финансовая дисциплина",
    description: "Месяц без перерасхода финансовых целей",
    check: async (ctx) => {
      const financialGoals = ctx.goals.filter(g => g.type === GoalType.FINANCIAL);
      if (financialGoals.length === 0) return false;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Проверяем, что все финансовые цели не превышены за месяц
      for (const goal of financialGoals) {
        const entriesThisMonth = goal.entries.filter(e => 
          e.date >= monthStart && e.date <= now
        );
        const total = entriesThisMonth.reduce((sum, e) => sum + (e.value ?? 0), 0);
        if (goal.target && total > goal.target) {
          return false;
        }
      }
      
      return financialGoals.length > 0;
    },
  },
  {
    code: "FIVE_GOALS",
    title: "Многозадачность",
    description: "Создано 5 активных целей",
    check: async (ctx) => {
      const active = ctx.goals.filter(g => !g.archived);
      return active.length >= 5;
    },
  },
  {
    code: "CONSISTENT_WEEK",
    title: "Стабильная неделя",
    description: "Все активные цели выполнены за неделю",
    check: async (ctx) => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const activeGoals = ctx.goals.filter(g => !g.archived);
      if (activeGoals.length === 0) return false;

      for (const goal of activeGoals) {
        const recentEntries = goal.entries.filter(e => e.date >= weekAgo);
        if (recentEntries.length === 0) return false;
        
        if (goal.type === GoalType.BINARY) {
          const hasSuccess = recentEntries.some(e => (e.value ?? 0) > 0);
          if (!hasSuccess) return false;
        } else if (goal.target && goal.target > 0) {
          const sum = recentEntries.reduce((acc, e) => acc + (e.value ?? 0), 0);
          if (sum < goal.target * 0.8) return false; // 80% порог
        }
      }
      
      return true;
    },
  },
];

// Вычисляем максимальную серию (streak) по всем записям
async function calculateMaxStreak(entries: GoalEntry[]): Promise<number> {
  if (entries.length === 0) return 0;

  // Группируем записи по датам и сортируем
  const dates = entries
    .map(e => normalizeDate(e.date).getTime())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => a - b);

  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const dayDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

// Проверяем и начисляем достижения для пользователя
export async function checkAndAwardAchievements(userId: string): Promise<void> {
  // Получаем все цели и записи пользователя
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { entries: { orderBy: { date: 'asc' } } },
  });

  const allEntries = goals.flatMap(g => g.entries);

  // Получаем уже полученные достижения
  const existingAchievements = await prisma.achievement.findMany({
    where: { userId },
    select: { code: true },
  });

  const existingCodes = new Set(existingAchievements.map(a => a.code));

  const context: AchievementContext = {
    userId,
    goals,
    allEntries,
  };

  // Проверяем каждое правило
  for (const rule of ACHIEVEMENT_RULES) {
    if (existingCodes.has(rule.code)) continue; // Уже получено

    const achieved = await rule.check(context);
    
    if (achieved) {
      await prisma.achievement.create({
        data: {
          userId,
          code: rule.code,
          title: rule.title,
          description: rule.description,
          unlockedAt: new Date(),
        },
      });
    }
  }
}

// Получить текущую серию (streak) для конкретной цели
export async function getCurrentStreak(goalId: string): Promise<number> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { entries: { orderBy: { date: 'desc' } } },
  });

  if (!goal || goal.entries.length === 0) return 0;

  const today = normalizeDate(new Date());
  let streak = 0;
  let checkDate = today;

  // Идем назад от сегодняшнего дня
  for (let i = 0; i < 365; i++) {
    const entry = goal.entries.find(e => 
      normalizeDate(e.date).getTime() === checkDate.getTime()
    );

    if (!entry) break;

    // Для бинарных целей проверяем выполнение
    if (goal.type === GoalType.BINARY) {
      if ((entry.value ?? 0) > 0) {
        streak++;
      } else {
        break;
      }
    } else {
      // Для количественных - если есть прогресс
      if ((entry.value ?? 0) > 0) {
        streak++;
      } else {
        break;
      }
    }

    checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

// Получить все серии для всех целей пользователя
export async function getAllStreaks(userId: string): Promise<Map<string, number>> {
  const goals = await prisma.goal.findMany({
    where: { userId, archived: false },
    select: { id: true },
  });

  const streaks = new Map<string, number>();
  
  for (const goal of goals) {
    const streak = await getCurrentStreak(goal.id);
    streaks.set(goal.id, streak);
  }

  return streaks;
}

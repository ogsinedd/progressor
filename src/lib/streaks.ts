import { type Goal, type GoalEntry, type StreakFreeze, GoalType } from "@/generated/prisma/client";
import { normalizeDate } from "./date";
import prisma from "./prisma";

export type StreakInfo = {
  current: number;
  longest: number;
  lastDate: Date | null;
  freezesUsedThisMonth?: number;
  freezesRemaining?: number;
};

/**
 * Вычисляет текущую и максимальную серию для цели (с учётом freeze)
 */
export async function calculateStreakWithFreeze(
  goal: Goal & { entries: GoalEntry[] },
  userId: string
): Promise<StreakInfo> {
  // Получаем freezes для этой цели
  const freezes = await prisma.streakFreeze.findMany({
    where: { goalId: goal.id, userId },
    orderBy: { freezeDate: "desc" },
  });

  return calculateStreakInternal(goal, freezes);
}

/**
 * Вычисляет текущую и максимальную серию для цели (без БД запросов, для обратной совместимости)
 */
export function calculateStreak(
  goal: Goal & { entries: GoalEntry[] }
): StreakInfo {
  return calculateStreakInternal(goal, []);
}

/**
 * Внутренняя функция расчёта streak с опциональными freezes
 */
function calculateStreakInternal(
  goal: Goal & { entries: GoalEntry[] },
  freezes: StreakFreeze[]
): StreakInfo {
  if (goal.entries.length === 0) {
    return { current: 0, longest: 0, lastDate: null };
  }

  // Сортируем записи по дате (от новых к старым)
  const sortedEntries = [...goal.entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Фильтруем только "успешные" записи
  const successfulEntries = sortedEntries.filter((entry) => {
    if (goal.type === GoalType.BINARY) {
      return (entry.value ?? 0) > 0;
    }
    // Для количественных и финансовых - любой прогресс считается
    return (entry.value ?? 0) > 0;
  });

  if (successfulEntries.length === 0) {
    return { current: 0, longest: 0, lastDate: null };
  }

  // Создаём Set freeze дат для быстрого поиска
  const freezeDates = new Set(
    freezes.map((f) => normalizeDate(f.freezeDate).getTime())
  );

  // Вычисляем текущую серию (с сегодняшнего дня назад)
  const today = normalizeDate(new Date());
  let currentStreak = 0;
  let checkDate = today;

  for (let i = 0; i < 365; i++) {
    const dateKey = checkDate.getTime();

    // Если freeze на эту дату - пропускаем, streak продолжается
    if (freezeDates.has(dateKey)) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      continue;
    }

    const entry = successfulEntries.find(
      (e) => normalizeDate(e.date).getTime() === dateKey
    );

    if (entry) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      // Если пропустили сегодняшний день, проверим вчера
      if (i === 0) {
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        continue;
      }
      break;
    }
  }

  // Вычисляем максимальную серию за все время
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  const allDates = successfulEntries.map((e) => normalizeDate(e.date));

  for (const date of allDates.reverse()) {
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const dayDiff =
        (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = date;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Подсчитываем freeze в текущем месяце
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const freezesThisMonth = freezes.filter((f) => f.freezeDate >= monthStart);

  return {
    current: currentStreak,
    longest: longestStreak,
    lastDate: successfulEntries[0]?.date ?? null,
    freezesUsedThisMonth: freezesThisMonth.length,
    freezesRemaining: undefined, // будет заполнено позже из user.freezeLimitPerMonth
  };
}

/**
 * Получить историю прогресса за последние N дней для графика
 */
export function getProgressHistory(
  goal: Goal & { entries: GoalEntry[] },
  days: number = 30
): { date: string; value: number }[] {
  const today = normalizeDate(new Date());
  const history: { date: string; value: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const entry = goal.entries.find(
      (e) => normalizeDate(e.date).getTime() === checkDate.getTime()
    );

    history.push({
      date: checkDate.toISOString(),
      value: entry?.value ?? 0,
    });
  }

  return history;
}

/**
 * Получить средние значения по дням недели
 */
export function getAveragesByWeekday(
  goal: Goal & { entries: GoalEntry[] }
): Record<string, number> {
  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const sums: Record<number, number> = {};
  const counts: Record<number, number> = {};

  for (const entry of goal.entries) {
    const day = (entry.date.getDay() + 6) % 7; // Преобразуем в Пн=0, Вс=6
    sums[day] = (sums[day] ?? 0) + (entry.value ?? 0);
    counts[day] = (counts[day] ?? 0) + 1;
  }

  const averages: Record<string, number> = {};
  weekdays.forEach((name, index) => {
    averages[name] = counts[index] ? Math.round((sums[index] / counts[index]) * 10) / 10 : 0;
  });

  return averages;
}

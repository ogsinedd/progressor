import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

import { GoalPeriod } from "@/generated/prisma/client";

const weekOptions = { weekStartsOn: 1 as const };

export function normalizeDate(date: Date) {
  return startOfDay(date);
}

export function currentPeriodRange(
  period: GoalPeriod,
  reference: Date,
  customStart?: Date | null,
  customEnd?: Date | null,
) {
  const date = normalizeDate(reference);

  switch (period) {
    case GoalPeriod.DAILY:
      return { start: startOfDay(date), end: endOfDay(date) };
    case GoalPeriod.WEEKLY:
      return {
        start: startOfWeek(date, weekOptions),
        end: endOfWeek(date, weekOptions),
      };
    case GoalPeriod.MONTHLY:
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case GoalPeriod.YEARLY:
      return { start: startOfYear(date), end: endOfYear(date) };
    case GoalPeriod.CUSTOM: {
      if (customStart && customEnd) {
        return {
          start: startOfDay(customStart),
          end: endOfDay(customEnd),
        };
      }
      if (customStart) {
        return {
          start: startOfDay(customStart),
          end: endOfDay(addDays(customStart, 30)),
        };
      }
      return { start: startOfDay(date), end: endOfDay(date) };
    }
    default:
      return { start: startOfDay(date), end: endOfDay(date) };
  }
}

export function isWithin(date: Date, start: Date, end: Date) {
  const value = date.getTime();
  return value >= start.getTime() && value <= end.getTime();
}


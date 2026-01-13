import {
  type Goal,
  GoalMetric,
  GoalType,
  type GoalEntry,
} from "@/generated/prisma/client";

import { currentPeriodRange, isWithin, normalizeDate } from "./date";

export type ProgressState = {
  current: number;
  target: number;
  percent: number;
  status: "green" | "yellow" | "red";
};

export function findEntryForDate(entries: GoalEntry[], date: Date) {
  const normalized = normalizeDate(date).getTime();
  return entries.find(
    (entry) => normalizeDate(entry.date).getTime() === normalized,
  );
}

export function calculateProgress(
  goal: Goal & { entries: GoalEntry[] },
  reference: Date = new Date(),
): ProgressState {
  const { start, end } = currentPeriodRange(
    goal.period,
    reference,
    goal.customPeriodStart ?? undefined,
    goal.customPeriodEnd ?? undefined,
  );

  const relevantEntries = goal.entries.filter((entry) =>
    isWithin(entry.date, start, end),
  );

  const currentValue =
    goal.type === GoalType.BINARY
      ? relevantEntries.some((entry) => (entry.value ?? 0) > 0)
        ? 1
        : 0
      : relevantEntries.reduce((sum, entry) => sum + (entry.value ?? 0), 0);

  const targetValue =
    goal.type === GoalType.BINARY ? 1 : Math.max(goal.target ?? 0, 0);

  if (goal.metric === GoalMetric.AT_MOST) {
    if (!targetValue) {
      return {
        current: currentValue,
        target: 0,
        percent: 0,
        status: "yellow",
      };
    }

    const percent = Math.max(
      0,
      Math.min(100, ((targetValue - currentValue) / targetValue) * 100),
    );
    const status = currentValue <= targetValue ? "green" : "red";

    return {
      current: round(currentValue),
      target: targetValue,
      percent: round(percent),
      status,
    };
  }

  if (!targetValue) {
    return {
      current: round(currentValue),
      target: 0,
      percent: 0,
      status: "yellow",
    };
  }

  const percent = Math.min((currentValue / targetValue) * 100, 100);
  const status = percent >= 100 ? "green" : percent >= 60 ? "yellow" : "red";

  return {
    current: round(currentValue),
    target: targetValue,
    percent: round(percent),
    status,
  };
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}


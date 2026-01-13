import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ImportPayload = {
  user?: {
    xp?: number;
    level?: number;
    penaltiesEnabled?: boolean;
  };
  goals?: any[];
  achievements?: any[];
  xpEvents?: any[];
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as ImportPayload;
  const goals = payload.goals ?? [];
  const achievements = payload.achievements ?? [];
  const xpEvents = payload.xpEvents ?? [];

  await prisma.$transaction(async (tx) => {
    const existingGoals = await tx.goal.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    if (existingGoals.length) {
      await tx.goalEntry.deleteMany({
        where: { goalId: { in: existingGoals.map((g) => g.id) } },
      });
    }

    await tx.xpEvent.deleteMany({ where: { userId: user.id } });
    await tx.achievement.deleteMany({ where: { userId: user.id } });
    await tx.goal.deleteMany({ where: { userId: user.id } });

    if (payload.user) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: payload.user.xp ?? undefined,
          level: payload.user.level ?? undefined,
          penaltiesEnabled: payload.user.penaltiesEnabled ?? undefined,
        },
      });
    }

    if (goals.length) {
      await tx.goal.createMany({
        data: goals.map((g) => ({
          id: g.id,
          userId: user.id,
          title: g.title,
          description: g.description,
          type: g.type,
          period: g.period,
          metric: g.metric,
          target: g.target,
          targetUnit: g.targetUnit,
          startDate: g.startDate ? new Date(g.startDate) : new Date(),
          endDate: g.endDate ? new Date(g.endDate) : null,
          customPeriodStart: g.customPeriodStart
            ? new Date(g.customPeriodStart)
            : null,
          customPeriodEnd: g.customPeriodEnd
            ? new Date(g.customPeriodEnd)
            : null,
          xpReward: g.xpReward ?? 10,
          penalty: g.penalty ?? -2,
          allowPartial: g.allowPartial ?? true,
          allowNegative: g.allowNegative ?? false,
          archived: g.archived ?? false,
          createdAt: g.createdAt ? new Date(g.createdAt) : undefined,
        })),
        skipDuplicates: true,
      });
    }

    if (goals.length) {
      const entries = goals.flatMap((g) =>
        (g.entries ?? []).map((entry: any) => ({
          id: entry.id,
          goalId: g.id,
          date: entry.date ? new Date(entry.date) : new Date(),
          value: entry.value ?? 0,
          note: entry.note ?? null,
          createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
        })),
      );

      if (entries.length) {
        await tx.goalEntry.createMany({
          data: entries,
          skipDuplicates: true,
        });
      }
    }

    if (achievements.length) {
      await tx.achievement.createMany({
        data: achievements.map((item: any) => ({
          id: item.id,
          userId: user.id,
          code: item.code,
          title: item.title,
          description: item.description,
          unlockedAt: item.unlockedAt ? new Date(item.unlockedAt) : new Date(),
          data: item.data ?? undefined,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        })),
        skipDuplicates: true,
      });
    }

    if (xpEvents.length) {
      await tx.xpEvent.createMany({
        data: xpEvents.map((item: any) => ({
          id: item.id,
          userId: user.id,
          goalId: item.goalId ?? null,
          goalEntryId: item.goalEntryId ?? null,
          delta: item.delta ?? 0,
          reason: item.reason ?? "imported",
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        })),
        skipDuplicates: true,
      });
    }
  });

  return NextResponse.json({ ok: true });
}


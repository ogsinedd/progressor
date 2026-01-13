import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      name: true,
      xp: true,
      level: true,
      penaltiesEnabled: true,
      goals: { include: { entries: true } },
      achievements: true,
      xpEvents: true,
    },
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: {
      email: data?.email,
      name: data?.name,
      xp: data?.xp,
      level: data?.level,
      penaltiesEnabled: data?.penaltiesEnabled,
    },
    goals: data?.goals ?? [],
    achievements: data?.achievements ?? [],
    xpEvents: data?.xpEvents ?? [],
  });
}


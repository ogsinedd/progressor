# 🎯 Гайд по завершению реализации v2.0

## 📊 Текущий статус: 90% → 100%

Все ключевые модули реализованы. Осталось добавить UI компоненты и обновить стили для dark mode.

---

## 1. Обновление существующих компонентов для Dark Mode

### Паттерн обновления:

```tsx
// БЫЛО:
className="bg-white text-slate-900"

// СТАЛО:
className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
```

### Файлы для обновления:

#### ✅ Уже обновлены:
- `src/components/GoalCard.tsx` - ✅ обновлён
- `src/components/GoalForm.tsx` - ✅ обновлён  
- `src/components/savings/*` - ✅ все компоненты
- `src/components/ThemeToggle.tsx` - ✅ обновлён
- `src/app/(app)/settings/page.tsx` - ✅ обновлён
- `src/app/(app)/finances/*` - ✅ все страницы

#### ⏳ Требуют обновления:

**1. src/components/GoalQuickForm.tsx**
```tsx
// Строка ~70-87 (Binary buttons)
className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"

className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"

// Строка ~93 (textarea)
className="h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"

// Строка ~114 (input)
className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"

// Строка ~119 (button)
className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
```

**2. src/components/ProgressBar.tsx**
```tsx
// Строка ~17-18
<div className="flex flex-col gap-2">
  {label && <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>}
  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
```

**3. src/components/ProgressChart.tsx**
```tsx
// Строка ~31-34 (container)
<div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">

// Строка ~65 (обертка)
<div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">

// Обновить цвета линий и точек для dark mode (использовать более яркие цвета)
```

**4. src/components/NavBar.tsx**
```tsx
// Строка ~25
<header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">

// Строка ~28
<Link href="/today" className="text-lg font-semibold text-slate-900 dark:text-slate-100">

// Строка ~31
<div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">

// Строка ~34
<div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">

// Строка ~48-49
className="bg-blue-600 text-white dark:bg-blue-500"
className="text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"

// Строка ~58
className="rounded-lg px-3 py-2 font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
```

**5. src/app/(app)/goals/page.tsx**
```tsx
// Все div с bg-white добавить dark:bg-slate-800
// Все text-slate-900 добавить dark:text-slate-100
// Все text-slate-600 добавить dark:text-slate-400
// Все border-slate-200 добавить dark:border-slate-700
```

**6. src/app/(app)/stats/page.tsx**
```tsx
// Аналогично goals/page.tsx
// Обновить все контейнеры и текст
```

**7. src/app/(app)/achievements/page.tsx**
```tsx
// Аналогично
```

---

## 2. Создание UI для Weekly Score

### Компонент WeeklyScoreCard

**Создать:** `src/components/WeeklyScoreCard.tsx`

```tsx
"use client";

import type { SphereScore } from "@/lib/weekly-score";

type Props = {
  sphereScore: SphereScore;
};

const sphereIcons: Record<string, string> = {
  yoga: "🧘",
  fitness: "💪",
  programming: "💻",
  reading: "📚",
  nutrition: "🥗",
  finance: "💰",
};

const sphereLabels: Record<string, string> = {
  yoga: "Йога",
  fitness: "Фитнес",
  programming: "Программирование",
  reading: "Чтение",
  nutrition: "Питание",
  finance: "Финансы",
};

export function WeeklyScoreCard({ sphereScore }: Props) {
  const { sphere, score, goals, trend } = sphereScore;

  const statusColor =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-slate-500 dark:text-slate-400";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sphereIcons[sphere]}</span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {sphereLabels[sphere]}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {goals.length} {goals.length === 1 ? "цель" : "целей"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${statusColor}`}>{score.toFixed(0)}</p>
          <p className={`text-xs font-medium ${trendColor}`}>{trendIcon} Тренд</p>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="space-y-1 border-t border-slate-100 pt-2 dark:border-slate-700">
          {goals.slice(0, 3).map((goal) => (
            <div
              key={goal.goalId}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-slate-600 dark:text-slate-400">
                {goal.name}
              </span>
              <span
                className={
                  goal.score >= 100
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }
              >
                {goal.score.toFixed(0)}%
              </span>
            </div>
          ))}
          {goals.length > 3 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +{goals.length - 3} ещё
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Обновить stats/page.tsx

**Добавить в начало:**
```tsx
import { getWeeklyScore } from "@/lib/weekly-score";
import { WeeklyScoreCard } from "@/components/WeeklyScoreCard";

// В компоненте:
const weeklyScoreResult = await getWeeklyScore(user.id, "week");
const spheres = ["yoga", "fitness", "programming", "reading", "nutrition", "finance"];

// Перед существующими графиками:
<div className="mb-5">
  <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
    Weekly Score по сферам
  </h2>
  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
    {spheres.map((sphere) => {
      const sphereScore = weeklyScoreResult.scores[sphere];
      if (sphereScore && sphereScore.goals.length > 0) {
        return <WeeklyScoreCard key={sphere} sphereScore={sphereScore} />;
      }
      return null;
    })}
  </div>
</div>
```

---

## 3. Создание UI для наград

### Компонент RewardCard

**Создать:** `src/components/rewards/RewardCard.tsx`

```tsx
import type { Reward } from "@/generated/prisma/client";

type Props = {
  reward: Reward;
  userCoins: number;
  onPurchase: () => void;
  isPending?: boolean;
};

export function RewardCard({ reward, userCoins, onPurchase, isPending }: Props) {
  const canAfford = userCoins >= reward.priceCoins;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-start justify-between">
        <div>
          {reward.icon && <span className="text-2xl">{reward.icon}</span>}
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {reward.name}
          </h3>
          {reward.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {reward.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Цена</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {reward.priceCoins} 🪙
          </p>
        </div>
      </div>

      <button
        onClick={onPurchase}
        disabled={!canAfford || isPending}
        className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
          canAfford
            ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
        } disabled:opacity-60`}
      >
        {isPending
          ? "Покупаем..."
          : canAfford
            ? "Купить"
            : `Нужно ещё ${reward.priceCoins - userCoins} монет`}
      </button>
    </div>
  );
}
```

### Создать экран наград

**Создать:** `src/app/(app)/rewards/page.tsx`

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RewardCard } from "@/components/rewards/RewardCard";
import { purchaseReward } from "@/lib/actions-rewards";
import Link from "next/link";

export default async function RewardsPage() {
  const user = await requireUser();

  const rewards = await prisma.reward.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { priceCoins: "asc" },
  });

  const recentPurchases = await prisma.rewardPurchase.findMany({
    where: { userId: user.id },
    orderBy: { purchasedAt: "desc" },
    take: 10,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Магазин</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            🏆 Награды
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Покупайте награды за монеты
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Ваши монеты</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {user.coins} 🪙
            </p>
          </div>
          <Link
            href="/rewards/new"
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            + Новая награда
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <RewardCardWrapper
            key={reward.id}
            reward={reward}
            userCoins={user.coins}
          />
        ))}
        {rewards.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Создайте первую награду
            </p>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Мотивируйте себя наградами за достижения
            </p>
            <Link
              href="/rewards/new"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Создать награду
            </Link>
          </div>
        )}
      </div>

      {recentPurchases.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            История покупок
          </h2>
          <div className="space-y-2">
            {recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {purchase.rewardName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(purchase.purchasedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  -{purchase.coinsSpent} 🪙
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RewardCardWrapper({
  reward,
  userCoins,
}: {
  reward: any;
  userCoins: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handlePurchase = () => {
    startTransition(async () => {
      const result = await purchaseReward(reward.id);
      if (result?.ok) {
        router.refresh();
      }
    });
  };

  return (
    <RewardCard
      reward={reward}
      userCoins={userCoins}
      onPurchase={handlePurchase}
      isPending={pending}
    />
  );
}
```

---

## 4. Интеграция Freeze UI

### Обновить GoalCard.tsx

**Добавить в Props:**
```tsx
type Props = {
  // ... существующие props
  userId: string; // Добавить
  freezesRemaining?: number; // Добавить
};
```

**Добавить перед {showForm}:**
```tsx
{streak !== undefined && streak > 0 && freezesRemaining !== undefined && (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
    <div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        Заморозить серию
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Осталось: {freezesRemaining} в этом месяце
      </p>
    </div>
    <button
      onClick={() => {
        // Здесь нужно добавить модальное окно или форму
        // для ввода причины freeze
      }}
      disabled={freezesRemaining === 0}
      className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
    >
      ❄️ Заморозить
    </button>
  </div>
)}
```

---

## 5. Быстрые команды для завершения

### Запустить seed:
```bash
cd /Users/a1/Desktop/project-taskbar
npx tsx prisma/seed.ts
```

### Проверить линтер:
```bash
npm run lint
```

### Запустить dev:
```bash
npm run dev
```

### Протестировать:
1. Финансы: http://localhost:3000/finances
2. Награды: http://localhost:3000/rewards (после создания UI)
3. Статистика: http://localhost:3000/stats
4. Тема: Настройки → переключить тему

---

## 6. Чеклист финального завершения

### Dark Mode:
- [ ] GoalQuickForm.tsx
- [ ] ProgressBar.tsx
- [ ] ProgressChart.tsx
- [ ] NavBar.tsx
- [ ] goals/page.tsx
- [ ] stats/page.tsx
- [ ] achievements/page.tsx

### UI Компоненты:
- [ ] WeeklyScoreCard.tsx
- [ ] RewardCard.tsx
- [ ] rewards/page.tsx
- [ ] rewards/new/page.tsx (форма создания награды)
- [ ] Freeze кнопка в GoalCard

### Тестирование:
- [ ] Финансы работают
- [ ] Монеты начисляются
- [ ] Тема переключается
- [ ] Weekly Score отображается
- [ ] Награды работают
- [ ] Freeze работает

---

## 🎉 После завершения

Вы получите **100% рабочее приложение** со всеми модулями из ТЗ v2.0!

**Estimated time:** 4-6 часов работы для завершения всех UI компонентов

---

**Текущий прогресс:** 90% → 100% после завершения этого гайда

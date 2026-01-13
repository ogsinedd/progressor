# Техническая документация v2.0

## Содержание
1. [База данных: новые таблицы и миграции](#1-база-данных)
2. [API эндпоинты](#2-api-эндпоинты)
3. [Псевдокод ключевых модулей](#3-псевдокод)
4. [Роутинг и UI компоненты](#4-роутинг-и-ui-компоненты)
5. [Кэширование агрегатов](#5-кэширование-агрегатов)

---

## 1. База данных

### 1.1. Новые таблицы

#### savings_goals (Цели накоплений)
```sql
CREATE TABLE savings_goals (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('goal_savings', 'sinking_fund', 'emergency_fund')),
  
  target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  start_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP NULL,
  
  category VARCHAR(50) NULL, -- 'vacation', 'tech', 'emergency', 'education', etc.
  description TEXT NULL,
  icon VARCHAR(50) NULL,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_user_type (user_id, type)
);
```

#### savings_entries (Пополнения/снятия)
```sql
CREATE TABLE savings_entries (
  id VARCHAR(30) PRIMARY KEY,
  goal_id VARCHAR(30) NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  
  date TIMESTAMP NOT NULL,
  amount DECIMAL(12, 2) NOT NULL, -- может быть отрицательным (снятие)
  
  note TEXT NULL,
  source VARCHAR(50) NULL, -- 'salary', 'bonus', 'freelance', 'gift', etc.
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_goal_date (goal_id, date DESC),
  UNIQUE INDEX idx_goal_date_unique (goal_id, date)
);
```

#### rewards (Награды в магазине)
```sql
CREATE TABLE rewards (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  price_coins INT NOT NULL CHECK (price_coins > 0),
  
  icon VARCHAR(50) NULL,
  category VARCHAR(50) NULL,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_active (user_id, is_active)
);
```

#### reward_purchases (История покупок наград)
```sql
CREATE TABLE reward_purchases (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id VARCHAR(30) NOT NULL REFERENCES rewards(id) ON DELETE SET NULL,
  
  reward_name VARCHAR(120) NOT NULL, -- копия имени на момент покупки
  coins_spent INT NOT NULL,
  
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_date (user_id, purchased_at DESC)
);
```

#### goal_presets (Шаблоны целей)
```sql
CREATE TABLE goal_presets (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NULL REFERENCES users(id) ON DELETE CASCADE, -- NULL = системный
  
  name VARCHAR(120) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'yoga', 'fitness', 'programming', etc.
  
  preset_data JSON NOT NULL, -- { type, period, target, targetUnit, xpReward, penalty, ... }
  
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_category (category),
  INDEX idx_user_category (user_id, category)
);
```

#### weekly_plans (Планирование недели)
```sql
CREATE TABLE weekly_plans (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  week_start_date TIMESTAMP NOT NULL,
  week_end_date TIMESTAMP NOT NULL,
  
  focus_spheres JSON NOT NULL, -- [{ sphere: 'yoga', plan: '...' }, ...]
  
  review_answers JSON NULL, -- [{ question: '...', answer: '...' }, ...]
  auto_summary JSON NULL, -- { yoga: { progress: 0.71, trend: 'up' }, ... }
  
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_week (user_id, week_start_date DESC),
  UNIQUE INDEX idx_user_week_unique (user_id, week_start_date)
);
```

#### streak_freezes (Заморозки серий)
```sql
CREATE TABLE streak_freezes (
  id VARCHAR(30) PRIMARY KEY,
  goal_id VARCHAR(30) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  freeze_date TIMESTAMP NOT NULL,
  reason TEXT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_goal_date (goal_id, freeze_date),
  INDEX idx_user_month (user_id, freeze_date),
  UNIQUE INDEX idx_goal_freeze_date (goal_id, freeze_date)
);
```

#### quests (Персональные квесты)
```sql
CREATE TABLE quests (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  
  goal_ids JSON NOT NULL, -- [goal_id1, goal_id2, ...]
  
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  
  reward_xp INT NOT NULL DEFAULT 0,
  reward_coins INT NOT NULL DEFAULT 0,
  reward_achievement_code VARCHAR(50) NULL,
  
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_active (user_id, is_completed, end_date)
);
```

### 1.2. Изменения существующих таблиц

#### users (добавить поля)
```sql
ALTER TABLE users ADD COLUMN theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));
ALTER TABLE users ADD COLUMN coins INT NOT NULL DEFAULT 0 CHECK (coins >= 0);
ALTER TABLE users ADD COLUMN freeze_limit_per_month INT NOT NULL DEFAULT 1 CHECK (freeze_limit_per_month >= 0);
```

#### goals (добавить поля)
```sql
ALTER TABLE goals ADD COLUMN category VARCHAR(50) NULL;
ALTER TABLE goals ADD COLUMN icon VARCHAR(50) NULL;
```

---

## 2. API эндпоинты

### 2.1. Финансы (Savings)

#### POST /api/savings/goals
Создать цель накоплений

**Request:**
```json
{
  "name": "Отпуск в Европе",
  "type": "goal_savings",
  "targetAmount": 5000,
  "currency": "EUR",
  "startAmount": 0,
  "dueDate": "2026-08-01T00:00:00Z",
  "category": "vacation",
  "description": "Накопления на летний отпуск"
}
```

**Response:**
```json
{
  "id": "clxy123...",
  "userId": "clxy456...",
  "name": "Отпуск в Европе",
  "type": "goal_savings",
  "targetAmount": 5000,
  "currency": "EUR",
  "startAmount": 0,
  "currentAmount": 0,
  "progress": 0,
  "dueDate": "2026-08-01T00:00:00Z",
  "category": "vacation",
  "isActive": true,
  "createdAt": "2026-01-13T10:00:00Z"
}
```

#### GET /api/savings/goals
Получить все цели накоплений

**Query params:**
- `active=true|false` - фильтр по активности
- `type=goal_savings|sinking_fund|emergency_fund` - фильтр по типу

**Response:**
```json
{
  "goals": [
    {
      "id": "clxy123...",
      "name": "Отпуск в Европе",
      "type": "goal_savings",
      "targetAmount": 5000,
      "currentAmount": 2500,
      "progress": 50,
      "currency": "EUR",
      "dueDate": "2026-08-01T00:00:00Z",
      "projectedCompletionDate": "2026-07-15T00:00:00Z", // если есть достаточно данных
      "entriesCount": 5
    }
  ]
}
```

#### POST /api/savings/entries
Добавить пополнение/снятие

**Request:**
```json
{
  "goalId": "clxy123...",
  "date": "2026-01-13T00:00:00Z",
  "amount": 500,
  "note": "Часть зарплаты за январь",
  "source": "salary"
}
```

**Response:**
```json
{
  "id": "clxy789...",
  "goalId": "clxy123...",
  "date": "2026-01-13T00:00:00Z",
  "amount": 500,
  "note": "Часть зарплаты за январь",
  "source": "salary",
  "createdAt": "2026-01-13T10:00:00Z",
  "goalCurrentAmount": 3000,
  "goalProgress": 60
}
```

#### GET /api/savings/analytics/total-over-time
Получить историю накоплений

**Query params:**
- `range=30|90|365|custom` - период
- `startDate` - начало (для custom)
- `endDate` - конец (для custom)

**Response:**
```json
{
  "data": [
    { "date": "2025-12-15", "total": 2000 },
    { "date": "2025-12-22", "total": 2300 },
    { "date": "2026-01-01", "total": 2500 },
    { "date": "2026-01-13", "total": 3000 }
  ],
  "currency": "EUR",
  "range": "30",
  "growth": 1000,
  "growthPercent": 50
}
```

#### GET /api/savings/analytics/monthly-contributions
Получить месячные взносы

**Query params:**
- `months=12` - количество месяцев (по умолчанию 12)

**Response:**
```json
{
  "data": [
    { "month": "2025-02", "amount": 400 },
    { "month": "2025-03", "amount": 500 },
    ...
    { "month": "2026-01", "amount": 500 }
  ],
  "currency": "EUR",
  "averageMonthly": 450,
  "totalYear": 5400
}
```

#### GET /api/savings/analytics/goal-progress/:goalId
Получить детальный прогресс по цели

**Response:**
```json
{
  "goal": {
    "id": "clxy123...",
    "name": "Отпуск в Европе",
    "targetAmount": 5000,
    "currentAmount": 3000,
    "progress": 60
  },
  "entries": [
    { "date": "2025-12-15", "amount": 500, "source": "salary" },
    { "date": "2026-01-01", "amount": 300, "source": "bonus" },
    ...
  ],
  "projection": {
    "averageMonthly": 500,
    "estimatedCompletionDate": "2026-07-15",
    "daysRemaining": 184,
    "monthsRemaining": 6
  }
}
```

### 2.2. Weekly Score

#### GET /api/analytics/weekly-score
Получить weekly score по всем сферам

**Query params:**
- `period=week|month|year|custom` - период
- `startDate` - начало (для custom)
- `endDate` - конец (для custom)

**Response:**
```json
{
  "period": "week",
  "startDate": "2026-01-06",
  "endDate": "2026-01-12",
  "scores": {
    "yoga": {
      "score": 85.7,
      "goals": [
        { "goalId": "...", "name": "Медитация", "progress": 71.4 },
        { "goalId": "...", "name": "Практика", "progress": 100 }
      ],
      "trend": "up" // up/down/stable vs предыдущий период
    },
    "fitness": {
      "score": 66.7,
      "goals": [...],
      "trend": "stable"
    },
    "programming": {
      "score": 92.9,
      "goals": [...],
      "trend": "up"
    },
    "reading": {
      "score": 80.0,
      "goals": [...],
      "trend": "down"
    },
    "nutrition": {
      "score": 71.4,
      "goals": [...],
      "trend": "stable"
    },
    "finance": {
      "score": 75.0,
      "goals": [...],
      "trend": "up"
    }
  },
  "overall": 78.6
}
```

### 2.3. Награды (Rewards)

#### POST /api/rewards
Создать награду

**Request:**
```json
{
  "name": "Кино в кинотеатре",
  "description": "Поход в кино на любой фильм",
  "priceCoins": 50,
  "icon": "🎬",
  "category": "entertainment"
}
```

#### POST /api/rewards/:id/purchase
Купить награду

**Response:**
```json
{
  "purchase": {
    "id": "clxy...",
    "rewardName": "Кино в кинотеатре",
    "coinsSpent": 50,
    "purchasedAt": "2026-01-13T10:00:00Z"
  },
  "user": {
    "coinsRemaining": 25,
    "totalSpent": 150
  }
}
```

### 2.4. Шаблоны целей (Presets)

#### GET /api/presets
Получить все доступные пресеты

**Query params:**
- `category=yoga|fitness|programming|...` - фильтр по категории

**Response:**
```json
{
  "system": [
    {
      "id": "preset_meditation",
      "name": "Медитация",
      "category": "yoga",
      "presetData": {
        "type": "BINARY",
        "period": "DAILY",
        "target": 1,
        "xpReward": 10,
        "penalty": -2
      }
    }
  ],
  "user": [
    {
      "id": "clxy...",
      "name": "Моя тренировка",
      "category": "fitness",
      "presetData": {...}
    }
  ]
}
```

#### POST /api/presets/from-goal/:goalId
Создать пресет из существующей цели

**Response:**
```json
{
  "id": "clxy...",
  "name": "Моя тренировка",
  "category": "fitness",
  "presetData": {...}
}
```

### 2.5. Планирование недели

#### POST /api/weekly-plans
Создать план недели

**Request:**
```json
{
  "weekStartDate": "2026-01-13",
  "focusSpheres": [
    {
      "sphere": "yoga",
      "plan": "Медитировать каждое утро перед завтраком"
    },
    {
      "sphere": "programming",
      "plan": "Закончить курс по React, уделять 2 часа в день"
    }
  ]
}
```

#### PUT /api/weekly-plans/:id/review
Добавить review к плану

**Request:**
```json
{
  "reviewAnswers": [
    {
      "question": "Что помогло выполнить план?",
      "answer": "Чёткий план на неделю и напоминание на телефоне"
    },
    {
      "question": "Что мешало?",
      "answer": "Срочные задачи на работе в четверг и пятницу"
    }
  ]
}
```

**Response:**
```json
{
  "id": "clxy...",
  "weekStartDate": "2026-01-13",
  "isCompleted": true,
  "autoSummary": {
    "yoga": {
      "progress": 71.4,
      "completedGoals": 1,
      "totalGoals": 1,
      "trend": "up"
    },
    "programming": {
      "progress": 85.7,
      "completedGoals": 1,
      "totalGoals": 1,
      "trend": "stable"
    }
  }
}
```

### 2.6. Streak Freeze

#### POST /api/streaks/freeze
Заморозить streak

**Request:**
```json
{
  "goalId": "clxy123...",
  "freezeDate": "2026-01-13",
  "reason": "Болезнь, высокая температура"
}
```

**Response:**
```json
{
  "id": "clxy...",
  "goalId": "clxy123...",
  "freezeDate": "2026-01-13",
  "reason": "Болезнь, высокая температура",
  "freezesUsedThisMonth": 1,
  "freezesLimitPerMonth": 1,
  "freezesRemainingThisMonth": 0
}
```

#### GET /api/streaks/freeze-status/:goalId
Получить статус freeze для цели

**Response:**
```json
{
  "goalId": "clxy123...",
  "currentMonth": "2026-01",
  "freezesUsed": 1,
  "freezesLimit": 1,
  "freezesRemaining": 0,
  "freezeHistory": [
    {
      "date": "2026-01-13",
      "reason": "Болезнь, высокая температура"
    }
  ]
}
```

---

## 3. Псевдокод

### 3.1. Streak + Freeze

```typescript
// Расчёт streak с учётом freeze
function calculateStreakWithFreeze(
  goal: Goal,
  entries: GoalEntry[],
  freezes: StreakFreeze[]
): StreakInfo {
  const today = normalizeDate(new Date());
  let currentStreak = 0;
  let checkDate = today;
  
  // Создаём Set дат с freeze для быстрого поиска
  const freezeDates = new Set(
    freezes.map(f => normalizeDate(f.freezeDate).getTime())
  );
  
  // Создаём Map записей по датам
  const entriesMap = new Map(
    entries.map(e => [normalizeDate(e.date).getTime(), e])
  );
  
  // Идём назад от сегодня
  for (let i = 0; i < 365; i++) {
    const dateKey = checkDate.getTime();
    
    // Если freeze в этот день - пропускаем, streak продолжается
    if (freezeDates.has(dateKey)) {
      checkDate = subtractDays(checkDate, 1);
      continue;
    }
    
    // Проверяем entry
    const entry = entriesMap.get(dateKey);
    
    if (!entry) {
      // Если это первый день (i === 0), даём шанс - может сегодня ещё не отметил
      if (i === 0) {
        checkDate = subtractDays(checkDate, 1);
        continue;
      }
      // Иначе streak прерван
      break;
    }
    
    // Проверяем успешность entry
    const isSuccess = checkEntrySuccess(goal, entry);
    
    if (isSuccess) {
      currentStreak++;
      checkDate = subtractDays(checkDate, 1);
    } else {
      // Entry есть, но не успешный - streak прерван
      break;
    }
  }
  
  return {
    current: currentStreak,
    freezesUsedThisMonth: countFreezesInCurrentMonth(freezes),
    freezesRemaining: goal.freezeLimitPerMonth - countFreezesInCurrentMonth(freezes),
    lastSuccessDate: getLastSuccessDate(entries)
  };
}

// Проверка успешности entry
function checkEntrySuccess(goal: Goal, entry: GoalEntry): boolean {
  if (goal.type === 'BINARY') {
    return (entry.value ?? 0) > 0;
  }
  
  if (goal.type === 'QUANTITATIVE') {
    if (goal.target === null || goal.target === 0) {
      return (entry.value ?? 0) > 0; // Любой прогресс считается
    }
    return (entry.value ?? 0) >= goal.target; // Достижение цели
  }
  
  if (goal.type === 'FINANCIAL') {
    if (goal.metric === 'AT_MOST') {
      return (entry.value ?? 0) <= (goal.target ?? 0);
    }
  }
  
  return false;
}

// Подсчёт freeze в текущем месяце
function countFreezesInCurrentMonth(freezes: StreakFreeze[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return freezes.filter(f => {
    const freezeDate = new Date(f.freezeDate);
    return freezeDate >= monthStart && freezeDate <= monthEnd;
  }).length;
}
```

### 3.2. Weekly Score

```typescript
// Расчёт weekly score для сферы
function calculateWeeklyScore(
  userId: string,
  sphere: string,
  period: { start: Date; end: Date }
): number {
  // Получаем все цели сферы
  const goals = getGoalsBySphere(userId, sphere);
  
  if (goals.length === 0) return 0;
  
  // Рассчитываем score для каждой цели
  const goalScores = goals.map(goal => {
    const entries = getEntriesInPeriod(goal.id, period.start, period.end);
    return calculateGoalScore(goal, entries, period);
  });
  
  // Среднее арифметическое
  const averageScore = goalScores.reduce((sum, score) => sum + score, 0) / goalScores.length;
  
  return Math.round(averageScore * 10) / 10; // Округление до 1 знака
}

// Расчёт score для одной цели
function calculateGoalScore(
  goal: Goal,
  entries: GoalEntry[],
  period: { start: Date; end: Date }
): number {
  if (goal.type === 'BINARY') {
    // Бинарная: done / total дней в периоде
    const totalDays = getDaysBetween(period.start, period.end);
    const doneDays = entries.filter(e => (e.value ?? 0) > 0).length;
    return (doneDays / totalDays) * 100;
  }
  
  if (goal.type === 'QUANTITATIVE') {
    // Количественная: fact / plan
    const fact = entries.reduce((sum, e) => sum + (e.value ?? 0), 0);
    const plan = calculatePlanForPeriod(goal, period);
    
    if (plan === 0) return 0;
    
    return Math.min((fact / plan) * 100, 100);
  }
  
  if (goal.type === 'FINANCIAL') {
    if (goal.metric === 'AT_MOST') {
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

// Расчёт плана для периода (для количественных целей)
function calculatePlanForPeriod(
  goal: Goal,
  period: { start: Date; end: Date }
): number {
  if (goal.period === 'DAILY') {
    const days = getDaysBetween(period.start, period.end);
    return (goal.target ?? 0) * days;
  }
  
  if (goal.period === 'WEEKLY') {
    const weeks = Math.ceil(getDaysBetween(period.start, period.end) / 7);
    return (goal.target ?? 0) * weeks;
  }
  
  if (goal.period === 'MONTHLY') {
    const months = getMonthsBetween(period.start, period.end);
    return (goal.target ?? 0) * months;
  }
  
  if (goal.period === 'YEARLY') {
    const years = getYearsBetween(period.start, period.end);
    return (goal.target ?? 0) * years;
  }
  
  // CUSTOM: используем target напрямую
  return goal.target ?? 0;
}

// Расчёт тренда (сравнение с предыдущим периодом)
function calculateTrend(
  currentScore: number,
  previousScore: number
): 'up' | 'down' | 'stable' {
  const diff = currentScore - previousScore;
  const threshold = 5; // 5% разница считается значимой
  
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}
```

### 3.3. Агрегаторы финансов

```typescript
// Time series: total savings over time
async function getTotalSavingsOverTime(
  userId: string,
  range: number // days
): Promise<{ date: string; total: number }[]> {
  const endDate = new Date();
  const startDate = subtractDays(endDate, range);
  
  // Получаем все цели пользователя
  const goals = await getSavingsGoals(userId, { active: true });
  
  // Получаем все entries за период
  const allEntries = await getSavingsEntriesForGoals(
    goals.map(g => g.id),
    startDate,
    endDate
  );
  
  // Группируем по датам
  const entriesByDate = groupBy(allEntries, e => normalizeDate(e.date).toISOString());
  
  // Строим time series
  const result: { date: string; total: number }[] = [];
  let runningTotal = calculateInitialTotal(goals, startDate);
  
  for (let i = 0; i <= range; i++) {
    const currentDate = addDays(startDate, i);
    const dateKey = normalizeDate(currentDate).toISOString();
    
    // Добавляем entries этого дня
    const entriesOfDay = entriesByDate[dateKey] || [];
    const dayTotal = entriesOfDay.reduce((sum, e) => sum + e.amount, 0);
    runningTotal += dayTotal;
    
    result.push({
      date: dateKey,
      total: Math.round(runningTotal * 100) / 100
    });
  }
  
  return result;
}

// Monthly contributions (bar chart)
async function getMonthlyContributions(
  userId: string,
  months: number = 12
): Promise<{ month: string; amount: number }[]> {
  const endDate = new Date();
  const startDate = subtractMonths(endDate, months);
  
  const entries = await getSavingsEntriesForUser(userId, startDate, endDate);
  
  // Группируем по месяцам
  const entriesByMonth = groupBy(entries, e => {
    const date = new Date(e.date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Строим результат
  const result: { month: string; amount: number }[] = [];
  
  for (let i = 0; i < months; i++) {
    const monthDate = subtractMonths(endDate, months - i - 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    
    const entriesOfMonth = entriesByMonth[monthKey] || [];
    const monthTotal = entriesOfMonth
      .filter(e => e.amount > 0) // Только пополнения, не снятия
      .reduce((sum, e) => sum + e.amount, 0);
    
    result.push({
      month: monthKey,
      amount: Math.round(monthTotal * 100) / 100
    });
  }
  
  return result;
}

// Прогноз достижения цели (линейная регрессия)
function projectGoalCompletion(
  goal: SavingsGoal,
  entries: SavingsEntry[]
): { estimatedDate: Date | null; averageMonthly: number } | null {
  // Нужно минимум 5 пополнений для прогноза
  if (entries.length < 5) return null;
  
  // Фильтруем только пополнения (amount > 0)
  const contributions = entries.filter(e => e.amount > 0);
  
  if (contributions.length < 5) return null;
  
  // Сортируем по дате
  contributions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Вычисляем среднее месячное пополнение
  const firstDate = contributions[0].date;
  const lastDate = contributions[contributions.length - 1].date;
  const monthsElapsed = getMonthsBetween(firstDate, lastDate) || 1;
  
  const totalContributed = contributions.reduce((sum, e) => sum + e.amount, 0);
  const averageMonthly = totalContributed / monthsElapsed;
  
  // Текущий баланс
  const currentAmount = goal.startAmount + entries.reduce((sum, e) => sum + e.amount, 0);
  
  // Сколько осталось накопить
  const remaining = goal.targetAmount - currentAmount;
  
  if (remaining <= 0) {
    return { estimatedDate: new Date(), averageMonthly };
  }
  
  // Сколько месяцев потребуется
  const monthsNeeded = remaining / averageMonthly;
  
  // Прогнозируемая дата
  const estimatedDate = addMonths(new Date(), Math.ceil(monthsNeeded));
  
  return {
    estimatedDate,
    averageMonthly: Math.round(averageMonthly * 100) / 100
  };
}
```

---

## 4. Роутинг и UI компоненты

### 4.1. Новые роуты

```
/finances                         → Главный экран финансов
/finances/goals                   → Список целей накоплений
/finances/goals/new               → Создание новой цели
/finances/goals/:id               → Детали цели
/finances/goals/:id/edit          → Редактирование цели
/finances/analytics               → Аналитика финансов

/rewards                          → Магазин наград
/rewards/new                      → Создание награды
/rewards/history                  → История покупок

/weekly-plan                      → Текущий план недели
/weekly-plan/new                  → Создание плана
/weekly-plan/:id/review           → Review плана

/stats                            → Обновлённая статистика (с weekly score)

/settings/presets                 → Управление пресетами целей
```

### 4.2. Переиспользуемые UI компоненты

#### Существующие (уже реализованы)
```
ProgressBar.tsx                   - Прогресс-бар
ProgressChart.tsx                 - Line chart
GoalCard.tsx                      - Карточка цели
GoalForm.tsx                      - Форма цели
GoalQuickForm.tsx                 - Быстрый ввод
NavBar.tsx                        - Навигация
```

#### Новые (к реализации)
```
SavingsGoalCard.tsx               - Карточка цели накоплений
  Props: goal, currentAmount, progress, onAddEntry

SavingsEntryForm.tsx              - Форма добавления пополнения
  Props: goalId, onSuccess

SavingsChart.tsx                  - Специализированный график для финансов
  Props: data, type ('line'|'bar'), currency

WeeklyScoreCard.tsx               - Карточка weekly score для сферы
  Props: sphere, score, trend, goals

RewardCard.tsx                    - Карточка награды
  Props: reward, userCoins, onPurchase

PresetCard.tsx                    - Карточка пресета цели
  Props: preset, onSelect

WeeklyPlanForm.tsx                - Форма создания плана недели
  Props: weekStartDate, onSubmit

WeeklyReviewForm.tsx              - Форма review плана
  Props: plan, onSubmit

Sparkline.tsx                     - Мини-график для виджетов
  Props: data, width, height, color

ThemeToggle.tsx                   - Переключатель темы
  Props: none (использует контекст темы)

StreakBadge.tsx                   - Бейдж серии с freeze инфо
  Props: streak, freezesRemaining

CoinsBadge.tsx                    - Бейдж монет
  Props: coins, size

StatCard.tsx                      - Универсальная карточка статистики
  Props: title, value, subtitle, trend, icon
```

### 4.3. Обновление навигации

```tsx
// src/components/NavBar.tsx

const navItems = [
  { href: "/today", label: "Сегодня", icon: "📅" },
  { href: "/goals", label: "Цели", icon: "🎯" },
  { href: "/finances", label: "Финансы", icon: "💰" },  // Новый
  { href: "/stats", label: "Статистика", icon: "📊" },
  { href: "/rewards", label: "Награды", icon: "🏆" },    // Новый
  { href: "/achievements", label: "Достижения", icon: "🏅" },
  { href: "/settings", label: "Настройки", icon: "⚙️" },
];
```

---

## 5. Кэширование агрегатов

### 5.1. Стратегия кэширования

#### Что кэшируется
1. **Weekly Score** - по пользователю + период
2. **Total Savings Over Time** - по пользователю + range
3. **Monthly Contributions** - по пользователю + months
4. **Goal Projections** - по goalId

#### Ключи кэша
```typescript
// Redis keys pattern
const CACHE_KEYS = {
  WEEKLY_SCORE: (userId: string, period: string) => 
    `weekly_score:${userId}:${period}`,
  
  SAVINGS_TIMELINE: (userId: string, range: number) => 
    `savings_timeline:${userId}:${range}`,
  
  MONTHLY_CONTRIB: (userId: string, months: number) => 
    `monthly_contrib:${userId}:${months}`,
  
  GOAL_PROJECTION: (goalId: string) => 
    `goal_projection:${goalId}`,
};
```

#### TTL (Time To Live)
```typescript
const CACHE_TTL = {
  WEEKLY_SCORE: 60 * 60, // 1 час
  SAVINGS_TIMELINE: 60 * 30, // 30 минут
  MONTHLY_CONTRIB: 60 * 60 * 24, // 1 день
  GOAL_PROJECTION: 60 * 60, // 1 час
};
```

### 5.2. Инвалидация кэша

#### События, требующие инвалидации
```typescript
// После добавления/редактирования/удаления entry
async function invalidateOnEntryChange(userId: string, goalId: string) {
  await cache.del(CACHE_KEYS.WEEKLY_SCORE(userId, 'current'));
  await cache.del(CACHE_KEYS.WEEKLY_SCORE(userId, 'previous'));
  // Инвалидируем все периоды для weekly score
  await cache.delPattern(`weekly_score:${userId}:*`);
}

// После добавления savings entry
async function invalidateOnSavingsEntry(userId: string, goalId: string) {
  await cache.delPattern(`savings_timeline:${userId}:*`);
  await cache.delPattern(`monthly_contrib:${userId}:*`);
  await cache.del(CACHE_KEYS.GOAL_PROJECTION(goalId));
}

// После создания/изменения цели
async function invalidateOnGoalChange(userId: string, goalId: string) {
  await cache.delPattern(`weekly_score:${userId}:*`);
}
```

### 5.3. Псевдокод кэширования

```typescript
// Обёртка для кэшируемых функций
async function cached<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Проверяем кэш
  const cached = await cache.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Вычисляем значение
  const result = await fn();
  
  // Сохраняем в кэш
  await cache.set(key, JSON.stringify(result), 'EX', ttl);
  
  return result;
}

// Использование
async function getWeeklyScore(userId: string, period: string) {
  return cached(
    CACHE_KEYS.WEEKLY_SCORE(userId, period),
    CACHE_TTL.WEEKLY_SCORE,
    () => calculateWeeklyScoreUncached(userId, period)
  );
}
```

### 5.4. Fallback при отсутствии Redis

```typescript
// In-memory cache для dev окружения
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

function useCache() {
  if (process.env.REDIS_URL) {
    return redisCache;
  }
  return memoryCache;
}
```

---

## 6. Миграции (Prisma)

### 6.1. Создание миграций

```bash
# Добавить savings модели
npx prisma migrate dev --name add_savings_models

# Добавить rewards
npx prisma migrate dev --name add_rewards

# Добавить weekly plans
npx prisma migrate dev --name add_weekly_plans

# Добавить streak freezes
npx prisma migrate dev --name add_streak_freezes

# Добавить goal presets
npx prisma migrate dev --name add_goal_presets

# Добавить quests
npx prisma migrate dev --name add_quests

# Добавить theme и coins к User
npx prisma migrate dev --name add_theme_and_coins_to_user
```

### 6.2. Seeds для пресетов

```typescript
// prisma/seeds/presets.ts

const SYSTEM_PRESETS = [
  // Yoga
  {
    name: "Медитация",
    category: "yoga",
    presetData: {
      type: "BINARY",
      period: "DAILY",
      target: 1,
      xpReward: 10,
      penalty: -2,
      targetUnit: null,
    }
  },
  {
    name: "Йога-практика",
    category: "yoga",
    presetData: {
      type: "QUANTITATIVE",
      period: "WEEKLY",
      target: 3,
      xpReward: 15,
      penalty: -3,
      targetUnit: "тренировок",
    }
  },
  
  // Fitness
  {
    name: "Тренировки",
    category: "fitness",
    presetData: {
      type: "QUANTITATIVE",
      period: "WEEKLY",
      target: 3,
      xpReward: 20,
      penalty: -5,
      targetUnit: "тренировок",
    }
  },
  {
    name: "Шаги",
    category: "fitness",
    presetData: {
      type: "QUANTITATIVE",
      period: "DAILY",
      target: 10000,
      xpReward: 10,
      penalty: -2,
      targetUnit: "шагов",
    }
  },
  
  // Programming
  {
    name: "Обучение программированию",
    category: "programming",
    presetData: {
      type: "QUANTITATIVE",
      period: "DAILY",
      target: 2,
      xpReward: 20,
      penalty: -5,
      targetUnit: "часов",
    }
  },
  {
    name: "Практика кода",
    category: "programming",
    presetData: {
      type: "QUANTITATIVE",
      period: "WEEKLY",
      target: 100,
      xpReward: 15,
      penalty: -3,
      targetUnit: "строк",
    }
  },
  
  // Reading
  {
    name: "Страницы в день",
    category: "reading",
    presetData: {
      type: "QUANTITATIVE",
      period: "DAILY",
      target: 30,
      xpReward: 10,
      penalty: -2,
      targetUnit: "страниц",
    }
  },
  
  // Nutrition
  {
    name: "План питания",
    category: "nutrition",
    presetData: {
      type: "BINARY",
      period: "DAILY",
      target: 1,
      xpReward: 10,
      penalty: -2,
      targetUnit: null,
    }
  },
];

async function seedPresets() {
  for (const preset of SYSTEM_PRESETS) {
    await prisma.goalPreset.create({
      data: {
        ...preset,
        userId: null,
        isSystem: true,
      }
    });
  }
}
```

---

## 7. Тестирование

### 7.1. Unit тесты

```typescript
// tests/unit/weekly-score.test.ts
describe('Weekly Score Calculator', () => {
  it('should calculate binary goal score correctly', () => {
    const goal = createBinaryGoal();
    const entries = [
      { date: '2026-01-01', value: 1 },
      { date: '2026-01-02', value: 1 },
      { date: '2026-01-03', value: 0 },
    ];
    
    const score = calculateGoalScore(goal, entries, {
      start: new Date('2026-01-01'),
      end: new Date('2026-01-07')
    });
    
    expect(score).toBe(28.6); // 2/7 * 100
  });
  
  it('should calculate quantitative goal score correctly', () => {
    const goal = createQuantitativeGoal({ target: 10, period: 'DAILY' });
    const entries = [
      { date: '2026-01-01', value: 8 },
      { date: '2026-01-02', value: 12 },
      { date: '2026-01-03', value: 10 },
    ];
    
    const score = calculateGoalScore(goal, entries, {
      start: new Date('2026-01-01'),
      end: new Date('2026-01-03')
    });
    
    expect(score).toBe(100); // (8+12+10) / (10*3) * 100 = 100
  });
});
```

### 7.2. Integration тесты

```typescript
// tests/integration/savings-api.test.ts
describe('Savings API', () => {
  it('should create savings goal and calculate progress', async () => {
    const user = await createTestUser();
    
    // Создаём цель
    const goal = await request(app)
      .post('/api/savings/goals')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        name: 'Vacation',
        type: 'goal_savings',
        targetAmount: 5000,
        currency: 'EUR',
      })
      .expect(200);
    
    // Добавляем пополнение
    await request(app)
      .post('/api/savings/entries')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        goalId: goal.body.id,
        amount: 1000,
        date: new Date().toISOString(),
      })
      .expect(200);
    
    // Проверяем прогресс
    const progress = await request(app)
      .get(`/api/savings/analytics/goal-progress/${goal.body.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);
    
    expect(progress.body.goal.currentAmount).toBe(1000);
    expect(progress.body.goal.progress).toBe(20);
  });
});
```

---

**Версия:** 2.0  
**Дата:** 13 января 2026  
**Статус:** Готово к реализации

# Архитектура

- **Стек**: Next.js 16 (App Router, RSC), TypeScript, Tailwind v4, Prisma + SQLite, NextAuth (Credentials + PrismaAdapter), React Server Actions для простых мутаций.
- **Модели**: `User`, `Account`, `Session`, `VerificationToken`, `Goal`, `GoalEntry`, `Achievement`, `XPEvent` + enum `GoalType`, `GoalPeriod`, `GoalMetric`.
- **Аутентификация**: email+пароль через NextAuth Credentials, хеширование bcrypt. Сессии cookie; авто-логин через `getServerSession`.
- **Домены**:
  - Goals Engine: типы целей (колич/бинар/финансовые), периоды (день/нед/мес/год/кастом), метрика `AT_LEAST`/`AT_MOST`, таргет, диапазон дат, статус `archived`.
  - Goal entries: уникальны на пару (goalId, date), поддержка числа, чекбокса, заметки.
  - Прогресс: агрегирование по текущему периоду, проценты 0–100, цвета: зеленый = достигнуто, желтый = в процессе, красный = отставание.
  - Геймификация: XP-события на основе конфига (`xpReward`, `penalty`, глобальный флаг `penaltiesEnabled` у пользователя), история в `XPEvent`.
  - Достижения: rule-based (плейсхолдер, хранение в таблице для будущего расширения).
- **Экспорт/импорт**: API `GET /api/export` и `POST /api/import` (JSON), все сущности пользователя.
- **UI**:
  - 5 экранов: `Сегодня` (дефолт), `Цели`, `Статистика`, `Достижения`, `Настройки`.
  - Desktop-first, mobile-friendly (простая адаптивная сетка, min клик-путь 2–3).
  - Компоненты: layout с навигацией, карточки целей/прогресса, формы ввода с автосабмитом, простые состояния/цвета.
- **Конфигурация**:
  - `.env`: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
  - XP формула в `lib/xp.ts`, параметры цели `xpReward`/`penalty`, глобальный флаг штрафов у пользователя.


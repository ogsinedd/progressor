"use client";

type Props = {
  longestStreak: number;
  totalCompleted: number;
  weekCompletion: number;
};

const motivationalQuotes = [
  "Маленькие шаги каждый день — путь к большим целям! 🚀",
  "Вы на правильном пути! Продолжайте в том же духе! 💪",
  "Каждое выполненное действие приближает вас к мечте! ✨",
  "Прогресс — это не скорость, а направление! 🎯",
  "Сегодня лучший день, чтобы стать лучше! 🌟",
];

export function MotivationalStats({
  longestStreak,
  totalCompleted,
  weekCompletion,
}: Props) {
  const quote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const stats = [
    {
      icon: "🔥",
      label: "Лучшая серия",
      value: longestStreak,
      unit: longestStreak === 1 ? "день" : "дней",
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: "✅",
      label: "Всего выполнено",
      value: totalCompleted,
      unit: totalCompleted === 1 ? "цель" : "целей",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: "📊",
      label: "За эту неделю",
      value: weekCompletion,
      unit: "%",
      color: "text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 shadow-sm dark:border-slate-700 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20">
      <div className="mb-4 text-center">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {quote}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-xl bg-white/80 p-3 backdrop-blur-sm dark:bg-slate-800/80"
          >
            <span className="text-2xl">{stat.icon}</span>
            <span className={`mt-1 text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {stat.unit}
            </span>
            <span className="mt-1 text-center text-xs font-medium text-slate-700 dark:text-slate-300">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

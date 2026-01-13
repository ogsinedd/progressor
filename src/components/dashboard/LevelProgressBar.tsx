"use client";

type Props = {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
};

export function LevelProgressBar({
  currentLevel,
  currentXP,
  xpForNextLevel,
}: Props) {
  const progress = Math.min(100, (currentXP / xpForNextLevel) * 100);
  const remaining = xpForNextLevel - currentXP;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4 shadow-sm dark:border-slate-700 dark:from-blue-950/30 dark:to-purple-950/30">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ваш уровень
          </p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {currentLevel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 dark:text-slate-400">До {currentLevel + 1} уровня</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {remaining} XP
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>{currentXP} XP</span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
          <span>{xpForNextLevel} XP</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>✨</span>
        <span>Выполняйте цели, чтобы получать XP и повышать уровень!</span>
      </div>
    </div>
  );
}

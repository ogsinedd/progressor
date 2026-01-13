"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Избегаем гидратационных ошибок
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Тема интерфейса
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Загрузка...
        </p>
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Тема интерфейса
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Текущая: {currentTheme === "dark" ? "Тёмная" : "Светлая"}
          {theme === "system" && " (системная)"}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTheme("light")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            theme === "light"
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
          }`}
          aria-label="Светлая тема"
        >
          ☀️ Светлая
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            theme === "dark"
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
          }`}
          aria-label="Тёмная тема"
        >
          🌙 Тёмная
        </button>

        <button
          onClick={() => setTheme("system")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            theme === "system"
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
          }`}
          aria-label="Системная тема"
        >
          💻 Авто
        </button>
      </div>
    </div>
  );
}

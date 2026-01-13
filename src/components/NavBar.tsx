"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/today", label: "Сегодня" },
  { href: "/goals", label: "Цели" },
  { href: "/finances", label: "Финансы" },
  { href: "/rewards", label: "Награды" },
  { href: "/stats", label: "Статистика" },
  { href: "/achievements", label: "Достижения" },
  { href: "/settings", label: "Настройки" },
];

type Props = {
  name?: string | null;
  level: number;
  xp: number;
};

export function NavBar({ name, level, xp }: Props) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link href="/today" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Progressor
          </Link>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {name ?? "Пользователь"}
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Уровень {level} · {xp} XP
          </div>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 font-medium transition ${
                  active
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg px-3 py-2 font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
}


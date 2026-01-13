"use client";

import { useActionState } from "react";

import { registerUserAction } from "@/lib/actions";

type FormState = {
  error?: string;
};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerUserAction,
    {} as FormState,
  );

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Регистрация</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Создайте локальный аккаунт для единственного пользователя.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Имя (опционально)
        <input
          name="name"
          type="text"
          className="h-11 rounded-lg border border-slate-200 px-3 text-slate-900 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Email
        <input
          name="email"
          type="email"
          required
          className="h-11 rounded-lg border border-slate-200 px-3 text-slate-900 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        Пароль
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="h-11 rounded-lg border border-slate-200 px-3 text-slate-900 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-blue-800"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {pending ? "Создаем..." : "Создать аккаунт"}
      </button>
    </form>
  );
}


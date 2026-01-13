import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { authOptions } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/today");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-900">
      <div className="flex w-full max-w-5xl flex-col items-center gap-6">
        <RegisterForm />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-blue-700 dark:text-blue-400">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}


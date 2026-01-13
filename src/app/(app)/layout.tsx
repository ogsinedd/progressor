import { NavBar } from "@/components/NavBar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavBar name={user.name} level={user.level} xp={user.xp} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-6">
        {children}
      </main>
    </div>
  );
}


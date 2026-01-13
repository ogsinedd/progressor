"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ImportForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fileInput = event.currentTarget.elements.namedItem(
      "file",
    ) as HTMLInputElement | null;
    const file = (fileInput?.files ?? [])[0];

    if (!file) {
      setError("Выберите JSON-файл");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text !== "string") return;

      startTransition(async () => {
        setError(null);
        try {
          const res = await fetch("/api/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: text,
          });
          if (!res.ok) {
            throw new Error("Импорт завершился ошибкой");
          }
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        }
      });
    };
    reader.readAsText(file);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Импорт JSON</p>
          <p className="text-xs text-slate-500">Замещает текущие данные.</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Импортируем..." : "Импорт"}
        </button>
      </div>
      <input
        type="file"
        name="file"
        accept="application/json"
        className="text-sm text-slate-700"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </form>
  );
}


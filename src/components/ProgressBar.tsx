type Props = {
  percent: number;
  status: "green" | "yellow" | "red";
  label?: string;
};

const colors: Record<Props["status"], string> = {
  green: "bg-emerald-500 dark:bg-emerald-400",
  yellow: "bg-amber-500 dark:bg-amber-400",
  red: "bg-rose-500 dark:bg-rose-400",
};

export function ProgressBar({ percent, status, label }: Props) {
  const value = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>}
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-2 rounded-full ${colors[status]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}


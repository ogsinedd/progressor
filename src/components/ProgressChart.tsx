"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

type DataPoint = {
  date: string;
  value: number;
};

type Props = {
  data: DataPoint[];
  target?: number;
  unit?: string;
  title?: string;
};

export function ProgressChart({ data, target, unit = "", title }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        Недостаточно данных для построения графика
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => d.value),
    target ?? 0,
  );

  const chartHeight = 160;
  const chartWidth = Math.max(data.length * 40, 300);
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const xScale = (index: number) => {
    // Если только одна точка данных, размещаем её по центру
    if (data.length === 1) {
      return (chartWidth - padding.left - padding.right) / 2 + padding.left;
    }
    return padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  };

  const yScale = (value: number) => {
    if (maxValue === 0) return chartHeight - padding.bottom;
    return (
      chartHeight -
      padding.bottom -
      (value / maxValue) * (chartHeight - padding.top - padding.bottom)
    );
  };

  // Построение линии графика
  const pathData = data
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Построение области под графиком
  const areaData =
    pathData +
    ` L ${xScale(data.length - 1)} ${chartHeight - padding.bottom}` +
    ` L ${xScale(0)} ${chartHeight - padding.bottom} Z`;

  // Линия цели
  const targetY = target ? yScale(target) : null;

  return (
    <div className="flex flex-col gap-2">
      {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="overflow-visible"
        >
          {/* Сетка */}
          <g className="text-slate-200 dark:text-slate-600">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = yScale(maxValue * fraction);
              return (
                <line
                  key={fraction}
                  x1={padding.left}
                  x2={chartWidth - padding.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </g>

          {/* Область под графиком */}
          <path d={areaData} className="fill-blue-500/10 dark:fill-blue-400/20" />

          {/* Линия графика */}
          <path
            d={pathData}
            fill="none"
            className="stroke-blue-600 dark:stroke-blue-400"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Линия цели */}
          {targetY && (
            <line
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={targetY}
              y2={targetY}
              className="stroke-emerald-500 dark:stroke-emerald-400"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}

          {/* Точки данных */}
          {data.map((point, index) => {
            const x = xScale(index);
            const y = yScale(point.value);
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  className="fill-white stroke-blue-600 dark:fill-slate-800 dark:stroke-blue-400"
                  strokeWidth="2.5"
                />
                <title>
                  {format(parseISO(point.date), "d MMM", { locale: ru })}: {point.value} {unit}
                </title>
              </g>
            );
          })}

          {/* Метки оси Y */}
          <g className="text-[10px] text-slate-600 dark:text-slate-400">
            {[0, 0.5, 1].map((fraction) => {
              const y = yScale(maxValue * fraction);
              const value = Math.round(maxValue * fraction * 10) / 10;
              return (
                <text
                  key={fraction}
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="11"
                  fill="currentColor"
                >
                  {value}
                </text>
              );
            })}
          </g>

          {/* Метки оси X */}
          <g className="text-[10px] text-slate-600 dark:text-slate-400">
            {data.map((point, index) => {
              // Показываем каждую 3-ю метку, чтобы не было наложения
              if (data.length > 10 && index % 3 !== 0 && index !== data.length - 1) {
                return null;
              }
              const x = xScale(index);
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                >
                  {format(parseISO(point.date), "d MMM", { locale: ru })}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

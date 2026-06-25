import { clamp } from "@/lib/utils";

interface Props {
  value: number;
  target: number;
  label: string;
  unit?: string;
  color?: string;
}

export function ProgressRing({
  value,
  target,
  label,
  unit = "",
  color = "#4f46e5"
}: Props) {
  const pct = target > 0 ? clamp((value / target) * 100, 0, 100) : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="8"
            className="stroke-[rgb(var(--border))]"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="8"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{Math.round(value)}</span>
          <span className="text-xs text-[rgb(var(--muted))]">/ {target}{unit}</span>
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

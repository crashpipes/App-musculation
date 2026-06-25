"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface Props {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
}

export function LineProgressChart({ data, color = "#4f46e5", unit = "" }: Props) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[rgb(var(--muted))]">
        Pas encore de données.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="rgb(var(--muted))" />
        <YAxis tick={{ fontSize: 11 }} stroke="rgb(var(--muted))" domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{
            background: "rgb(var(--card))",
            border: "1px solid rgb(var(--border))",
            borderRadius: 12,
            fontSize: 12
          }}
          formatter={(v: number) => [`${v}${unit}`, ""]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

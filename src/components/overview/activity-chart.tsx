import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DayStat } from "@/lib/account-health";
import { formatDay } from "@/lib/metrics";

const SERIES = [
  { key: "invites", label: "Invites", color: "var(--chart-1)" },
  { key: "messages", label: "Messages", color: "var(--chart-2)" },
  { key: "accepted", label: "Accepted", color: "var(--chart-3)" },
  { key: "replies", label: "Replies", color: "var(--chart-4)" },
] as const;

export function ActivityChart({ series, height = 260 }: { series: DayStat[]; height?: number }) {
  const data = series.map((d) => ({ ...d, label: formatDay(d.date) }));
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--subtle-foreground)", fontSize: 11 }} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--subtle-foreground)", fontSize: 11 }} width={44} />
            <Tooltip
              cursor={{ stroke: "var(--border-strong)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border-strong)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
            />
            {SERIES.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} fill={`url(#fill-${s.key})`} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

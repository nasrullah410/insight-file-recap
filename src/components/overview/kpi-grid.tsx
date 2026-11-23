import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { DayStat } from "@/lib/account-health";
import { deltaPct, pct } from "@/lib/metrics";
import { cn } from "@/lib/utils";

interface Totals {
  invites: number;
  accepted: number;
  messages: number;
  replies: number;
  views: number;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[11px] text-subtle-foreground">—</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("num inline-flex items-center gap-0.5 text-[11px]", up ? "text-success" : "text-destructive")}>
      <Icon className="size-3" />
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

export function KpiGrid({
  current,
  previous,
  series,
  rangeLabel,
}: {
  current: Totals;
  previous: Totals;
  series: DayStat[];
  rangeLabel: string;
}) {
  const items: { key: keyof DayStat; label: string; value: string; sub: string; delta: number | null; color: string }[] = [
    { key: "invites", label: "Invites sent", value: current.invites.toLocaleString(), sub: `vs ${previous.invites.toLocaleString()} prior`, delta: deltaPct(current.invites, previous.invites), color: "var(--chart-1)" },
    { key: "accepted", label: "Accepted", value: current.accepted.toLocaleString(), sub: `${pct(current.accepted, current.invites).toFixed(0)}% acceptance`, delta: deltaPct(current.accepted, previous.accepted), color: "var(--chart-3)" },
    { key: "messages", label: "Messages sent", value: current.messages.toLocaleString(), sub: `vs ${previous.messages.toLocaleString()} prior`, delta: deltaPct(current.messages, previous.messages), color: "var(--chart-2)" },
    { key: "replies", label: "Replies", value: current.replies.toLocaleString(), sub: `${pct(current.replies, current.messages).toFixed(1)}% reply rate`, delta: deltaPct(current.replies, previous.replies), color: "var(--chart-4)" },
    { key: "views", label: "Profile views", value: current.views.toLocaleString(), sub: `vs ${previous.views.toLocaleString()} prior`, delta: deltaPct(current.views, previous.views), color: "var(--chart-5)" },
  ];

  return (
    <section aria-label={`Key numbers, ${rangeLabel}`} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item, i) => (
        <div key={item.key} className="panel animate-rise relative overflow-hidden p-4" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <Delta value={item.delta} />
          </div>
          <p className="num mt-2 text-[26px] leading-none font-semibold tracking-tight text-foreground">{item.value}</p>
          <p className="mt-1.5 text-[11px] text-subtle-foreground">{item.sub}</p>
          <div className="pointer-events-none mt-3 h-8 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={item.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={item.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey={item.key} stroke={item.color} strokeWidth={1.5} fill={`url(#spark-${item.key})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </section>
  );
}

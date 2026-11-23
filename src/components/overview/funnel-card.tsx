import { MessageSquare } from "lucide-react";

import { pct } from "@/lib/metrics";

export function FunnelCard({ invites, accepted, messages, replies }: { invites: number; accepted: number; messages: number; replies: number }) {
  const steps = [
    { label: "Invites sent", value: invites, rate: null as string | null },
    { label: "Accepted", value: accepted, rate: `${pct(accepted, invites).toFixed(0)}% of invites` },
    { label: "Replied", value: replies, rate: `${pct(replies, accepted).toFixed(1)}% of new connections` },
  ];
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-4">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <span className="num text-sm text-foreground">{s.value.toLocaleString()}</span>
          </div>
          <div className="mt-1.5 h-7 overflow-hidden rounded-md bg-muted">
            <div
              className="h-full rounded-md"
              style={{
                width: `${Math.max((s.value / max) * 100, 3)}%`,
                background: `color-mix(in oklab, var(--primary) ${100 - i * 30}%, var(--info))`,
              }}
            />
          </div>
          {s.rate && <p className="mt-1 text-[11px] text-subtle-foreground">{s.rate}</p>}
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-4 text-sm">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="size-4" /> Messages sent (incl. follow-ups)
        </span>
        <span className="num text-foreground">{messages.toLocaleString()}</span>
      </div>
      <p className="text-[11px] text-subtle-foreground">{pct(replies, messages).toFixed(1)}% reply rate per message</p>
    </div>
  );
}

import { Eye, Mail, MessageSquare, Mic, UserCheck, UserPlus } from "lucide-react";

import type { ActivityItem, ReplyItem } from "@/lib/demo-data";
import { accountName, campaignName, relativeTime } from "@/lib/workspace";
import { AccountAvatar } from "@/components/account-avatar";
import { Badge } from "@/components/ui/badge";

const SENTIMENT = {
  interested: { label: "Interested", variant: "success" as const },
  neutral: { label: "Question", variant: "info" as const },
  not_now: { label: "Not now", variant: "muted" as const },
};

export function RepliesFeed({ replies, now }: { replies: ReplyItem[]; now: Date }) {
  return (
    <section className="panel">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-semibold">Latest replies</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{replies.length} new conversations</p>
      </header>
      <ul className="divide-y divide-border">
        {replies.map((r) => {
          const s = SENTIMENT[r.sentiment];
          return (
            <li key={r.id} className="flex gap-3 px-5 py-3.5">
              <AccountAvatar name={r.prospect} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{r.prospect}</p>
                  <span className="shrink-0 text-[11px] text-subtle-foreground">{relativeTime(r.at, now)}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">“{r.snippet}”</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-subtle-foreground">
                  <Badge variant={s.variant}>{s.label}</Badge>
                  <span className="truncate">
                    via {accountName(r.accountId)} · {campaignName(r.campaignId)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
        {replies.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">No replies yet.</li>}
      </ul>
    </section>
  );
}

const KIND = {
  invite: { label: "Invite sent to", icon: UserPlus },
  accepted: { label: "Invite accepted by", icon: UserCheck },
  message: { label: "Message sent to", icon: MessageSquare },
  inmail: { label: "InMail sent to", icon: Mail },
  view: { label: "Viewed profile of", icon: Eye },
  voice: { label: "Voice note sent to", icon: Mic },
};

export function ActivityFeed({ activity, now }: { activity: ActivityItem[]; now: Date }) {
  return (
    <section className="panel">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">Live activity</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">What your profiles did most recently</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="pulse-dot relative block size-1.5 rounded-full bg-success text-success" /> Live
        </span>
      </header>
      <ol className="relative px-5 py-2">
        {activity.map((e) => {
          const k = KIND[e.kind];
          const Icon = k.icon;
          return (
            <li key={e.id} className="relative flex gap-3 py-2.5">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-muted-foreground">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  {k.label} <span className="font-medium text-foreground">{e.prospect}</span>
                </p>
                <p className="mt-0.5 truncate text-[11px] text-subtle-foreground">
                  {accountName(e.accountId)} · {campaignName(e.campaignId)}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-subtle-foreground">{relativeTime(e.at, now)}</span>
            </li>
          );
        })}
        {activity.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">No activity yet.</li>}
      </ol>
    </section>
  );
}

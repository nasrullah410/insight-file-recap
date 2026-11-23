import { Link } from "@tanstack/react-router";
import { ChevronRight, Clock3, MapPin } from "lucide-react";

import { formatDuration, sumHistory } from "@/lib/account-health";
import { pct } from "@/lib/metrics";
import type { AccountView } from "@/lib/workspace";
import { AccountAvatar } from "@/components/account-avatar";
import { SEVERITY_META, StatusBadge } from "@/components/status";
import { UsageMeter } from "@/components/usage-meter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { workingState } from "./working-state";

const TONE: Record<string, string> = {
  success: "text-success",
  muted: "text-subtle-foreground",
  danger: "text-destructive",
  info: "text-info",
};

export function AccountCard({ account, now, showTenant }: { account: AccountView; now: Date; showTenant: boolean }) {
  const week = sumHistory(account.history, 7);
  const ws = workingState(account, now);
  const resetIn = formatDuration(new Date(account.weeklyResetAt).getTime() - now.getTime());
  const borderTone =
    account.status === "disconnected"
      ? "border-l-destructive"
      : account.status === "limited"
        ? "border-l-info"
        : account.status === "at_risk"
          ? "border-l-warning"
          : "border-l-success";

  return (
    <Link
      to="/accounts"
      search={(prev) => ({ ...prev, account: account.id })}
      className={cn("panel group block border-l-2 p-5 transition-colors hover:border-border-strong hover:bg-elevated/40", borderTone)}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {/* Identity */}
        <div className="flex min-w-0 gap-3 xl:w-[300px] xl:shrink-0">
          <AccountAvatar name={account.name} status={account.status} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-foreground">{account.name}</p>
              <StatusBadge status={account.status} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-subtle-foreground">
              {showTenant && account.tenant && <Badge variant="outline">{account.tenant.name}</Badge>}
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {account.city} · <span className="num text-muted-foreground">{ws.clock.label}</span>
              </span>
              <span className={cn("inline-flex items-center gap-1", TONE[ws.tone])}>
                <Clock3 className="size-3" /> {ws.label}
              </span>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
          <UsageMeter
            label="Weekly invites"
            usage={account.weeklyInvites}
            hint={`Resets in ${resetIn}`}
          />
          <UsageMeter label="Invites today" usage={account.dailyInvites} />
          <UsageMeter label="Messages today" usage={account.dailyMessages} />
          <UsageMeter label="InMail credits" usage={account.inmailCredits} />
        </div>

        {/* 7-day performance */}
        <div className="xl:w-[240px] xl:shrink-0">
          <p className="mb-1.5 text-[10px] tracking-wider text-subtle-foreground uppercase">Last 7 days</p>
          <div className="grid grid-cols-3 gap-2">
          <Stat label="Accept" value={`${pct(week.accepted, week.invites).toFixed(0)}%`} warn={week.invites >= 30 && week.accepted / week.invites < 0.2} />
          <Stat label="Reply" value={`${pct(week.replies, week.messages).toFixed(1)}%`} />
          <Stat label="Pending" value={String(account.pendingInvites)} warn={account.pendingInvites >= 500} />
          </div>
        </div>
        <ChevronRight className="hidden size-5 shrink-0 self-center text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground xl:block" />
      </div>

      {account.issues.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {account.issues.map((issue) => {
            const meta = SEVERITY_META[issue.severity];
            return (
              <span key={issue.code} className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs", meta.bg, meta.border, meta.text)}>
                <span className="font-medium">{issue.title}</span>
                <span className="hidden text-muted-foreground sm:inline">· {issue.action}</span>
              </span>
            );
          })}
        </div>
      )}
    </Link>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-elevated/50 px-2.5 py-2">
      <p className="text-[11px] text-subtle-foreground">{label}</p>
      <p className={cn("num mt-0.5 text-base", warn ? "text-warning" : "text-foreground")}>{value}</p>
    </div>
  );
}

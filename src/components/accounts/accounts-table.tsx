import { Link, useNavigate } from "@tanstack/react-router";

import { formatDuration, sumHistory } from "@/lib/account-health";
import { pct } from "@/lib/metrics";
import type { AccountView } from "@/lib/workspace";
import { AccountAvatar } from "@/components/account-avatar";
import { SEVERITY_META, StatusBadge } from "@/components/status";
import { MiniMeter } from "@/components/usage-meter";
import { isExhausted, usageRatio, type Usage } from "@/lib/account-health";
import { cn } from "@/lib/utils";
import { workingState } from "./working-state";

const TONE: Record<string, string> = {
  success: "text-success",
  muted: "text-subtle-foreground",
  danger: "text-destructive",
  info: "text-info",
};

const TH = "bg-elevated px-3 py-2.5 text-left text-[12px] font-medium whitespace-nowrap text-muted-foreground";

export function AccountsTable({ accounts, now, showTenant }: { accounts: AccountView[]; now: Date; showTenant: boolean }) {
  const navigate = useNavigate({ from: "/accounts" });
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-[13px]">
          <thead className="border-b border-border">
            <tr>
              <th className={cn(TH, "pl-5")}>Profile</th>
              <th className={TH}>Status</th>
              <th className={cn(TH, "w-[230px]")}>Problems</th>
              <th className={TH}>Weekly invites</th>
              <th className={TH}>Today</th>
              <th className={TH}>InMail</th>
              <th className={cn(TH, "text-right")}>Accept · Reply 7d</th>
              <th className={cn(TH, "pr-5 text-right")}>Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((a) => {
              const week = sumHistory(a.history, 7);
              const ws = workingState(a, now);
              const accept = pct(week.accepted, week.invites);
              const top = a.issues[0];
              return (
                <tr
                  key={a.id}
                  onClick={() => navigate({ search: (prev) => ({ ...prev, account: a.id }) })}
                  className="cursor-pointer align-top transition-colors hover:bg-accent/50"
                >
                  <td className="py-3 pr-3 pl-5">
                    <div className="flex items-start gap-3">
                      <AccountAvatar name={a.name} status={a.status} />
                      <div className="min-w-0">
                        <Link
                          to="/accounts"
                          search={(prev) => ({ ...prev, account: a.id })}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {a.name}
                        </Link>
                        <p className="max-w-[200px] truncate text-[12px] text-muted-foreground">{a.headline}</p>
                        <p className="mt-0.5 text-[11px] whitespace-nowrap text-subtle-foreground">
                          {showTenant && a.tenant ? `${a.tenant.name} · ` : ""}
                          {a.city} <span className="num">{ws.clock.label}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={a.status} />
                    <p className={cn("mt-1 text-[11px] whitespace-nowrap", TONE[ws.tone])}>{ws.label}</p>
                  </td>
                  <td className="px-3 py-3">
                    {top ? (
                      <div className="w-[210px]">
                        <p className={cn("text-[12px] font-medium", SEVERITY_META[top.severity].text)}>{top.title}</p>
                        <p className="text-[11px] text-subtle-foreground">
                          {top.action}
                          {a.issues.length > 1 ? ` · +${a.issues.length - 1} more` : ""}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[12px] text-subtle-foreground">None</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <MiniMeter usage={a.weeklyInvites} hint={`Resets in ${formatDuration(new Date(a.weeklyResetAt).getTime() - now.getTime())}`} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1.5">
                      <TodayLine label="Invites" usage={a.dailyInvites} />
                      <TodayLine label="Msgs" usage={a.dailyMessages} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <MiniMeter usage={a.inmailCredits} />
                  </td>
                  <td className="num px-3 py-3 text-right whitespace-nowrap">
                    <span className={week.invites >= 30 && accept < 20 ? "font-medium text-warning" : "text-foreground"}>{accept.toFixed(0)}%</span>
                    <span className="text-subtle-foreground"> · </span>
                    <span className="text-foreground">{pct(week.replies, week.messages).toFixed(1)}%</span>
                  </td>
                  <td className={cn("num py-3 pr-5 pl-3 text-right", a.pendingInvites >= 500 ? "font-medium text-warning" : "text-foreground")}>
                    {a.pendingInvites}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TodayLine({ label, usage }: { label: string; usage: Usage }) {
  const full = isExhausted(usage);
  return (
    <div className="flex items-center gap-2">
      <span className="w-11 text-[11px] text-subtle-foreground">{label}</span>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", full ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.max(usageRatio(usage) * 100, 2)}%` }} />
      </div>
      <span className={cn("num text-[12px] whitespace-nowrap", full ? "font-semibold text-destructive" : "text-foreground")}>
        {usage.used}
        <span className="font-normal text-subtle-foreground">/{usage.limit}</span>
      </span>
    </div>
  );
}

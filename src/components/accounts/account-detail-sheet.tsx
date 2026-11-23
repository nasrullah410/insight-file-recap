import { CalendarClock, Globe2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { formatDuration, sumHistory } from "@/lib/account-health";
import { pct } from "@/lib/metrics";
import { relativeTime, type AccountView, type CampaignView } from "@/lib/workspace";
import { AccountAvatar } from "@/components/account-avatar";
import { ActivityChart } from "@/components/overview/activity-chart";
import { CampaignHealthBadge, SEVERITY_META, StatusBadge, STATUS_META } from "@/components/status";
import { UsageMeter } from "@/components/usage-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { workingState } from "./working-state";

export function AccountDetailSheet({
  account,
  campaigns,
  now,
  onClose,
}: {
  account: AccountView | undefined;
  campaigns: CampaignView[];
  now: Date;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!account} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto border-border bg-card p-0 sm:max-w-xl">
        {account && <Body account={account} campaigns={campaigns} now={now} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ account, campaigns, now }: { account: AccountView; campaigns: CampaignView[]; now: Date }) {
  const ws = workingState(account, now);
  const week = sumHistory(account.history, 7);
  const resetIn = formatDuration(new Date(account.weeklyResetAt).getTime() - now.getTime());
  const used = campaigns.filter((c) => c.accountIds.includes(account.id));
  const demo = (action: string) => toast(action, { description: "Preview only — this will run against LinkedIn once connected to your backend." });

  return (
    <div>
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-4 pr-6">
          <AccountAvatar name={account.name} status={account.status} size="lg" />
          <div className="min-w-0">
            <SheetTitle className="text-xl">{account.name}</SheetTitle>
            <SheetDescription className="mt-0.5">{account.headline}</SheetDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={account.status} />
              <Badge variant="outline">{account.plan}</Badge>
              {account.tenant && <Badge variant="outline">{account.tenant.name}</Badge>}
            </div>
          </div>
        </div>
        <p className={cn("mt-4 text-sm", STATUS_META[account.status].text)}>{STATUS_META[account.status].hint}</p>
      </div>

      <div className="space-y-6 p-6">
        {account.issues.length > 0 ? (
          <section className="space-y-2">
            <h3 className="eyebrow">Problems & limits</h3>
            {account.issues.map((issue) => {
              const meta = SEVERITY_META[issue.severity];
              return (
                <div key={issue.code} className={cn("rounded-lg border p-3.5", meta.bg, meta.border)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-sm font-medium", meta.text)}>{issue.title}</p>
                    <span className={cn("text-[11px]", meta.text)}>{meta.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{issue.detail}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground">{issue.action}</span>
                    {(issue.code === "session_expired" || issue.code === "restricted") && (
                      <Button size="sm" variant="signal" onClick={() => demo("Reconnect started")}>
                        <RefreshCw /> Reconnect
                      </Button>
                    )}
                    {issue.code === "pending_invites_high" && (
                      <Button size="sm" variant="soft" onClick={() => demo("Withdrawing old invites")}>
                        Withdraw old invites
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <section className="rounded-lg border border-success/25 bg-success/10 p-3.5 text-sm text-success">
            No problems — this profile is within all LinkedIn limits.
          </section>
        )}

        <section className="space-y-3">
          <h3 className="eyebrow">Limits</h3>
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-elevated/40 p-4">
            <UsageMeter label="Weekly invites" usage={account.weeklyInvites} hint={`Resets in ${resetIn}`} />
            <UsageMeter label="Invites today" usage={account.dailyInvites} hint="Resets at local midnight" />
            <UsageMeter label="Messages today" usage={account.dailyMessages} hint="Resets at local midnight" />
            <UsageMeter label="InMail credits (month)" usage={account.inmailCredits} />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="eyebrow">Last 14 days</h3>
            <span className="num text-xs text-muted-foreground">
              7d: {pct(week.accepted, week.invites).toFixed(0)}% accept · {pct(week.replies, week.messages).toFixed(1)}% reply
            </span>
          </div>
          <div className="rounded-lg border border-border bg-elevated/40 p-4">
            <ActivityChart series={account.history.slice(-14)} height={180} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-elevated/40 p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe2 className="size-3.5" /> Timezone
            </p>
            <p className="mt-1 text-sm text-foreground">
              {account.city} · <span className="num">{ws.clock.label}</span>
            </p>
            <p className="text-[11px] text-subtle-foreground">{account.timezone}</p>
          </div>
          <div className="rounded-lg border border-border bg-elevated/40 p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" /> Working hours
            </p>
            <p className="mt-1 text-sm text-foreground">{ws.schedule}</p>
            <p className="text-[11px] text-subtle-foreground">{ws.label}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="eyebrow">Campaigns using this profile</h3>
          {used.length === 0 && <p className="text-sm text-muted-foreground">Not assigned to any campaign.</p>}
          {used.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-elevated/40 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{c.name}</p>
                <p className="text-[11px] text-subtle-foreground">
                  {c.senders.length} sending {c.senders.length === 1 ? "profile" : "profiles"}
                </p>
              </div>
              <CampaignHealthBadge health={c.health} />
            </div>
          ))}
        </section>

        <p className="text-center text-[11px] text-subtle-foreground">
          Last synced {relativeTime(account.lastSyncAt, now)} · {account.pendingInvites} pending invites
        </p>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";

import { sumHistory } from "@/lib/account-health";
import { TENANTS } from "@/lib/demo-data";
import { pct } from "@/lib/metrics";
import { useWorkspace, type AccountView, type CampaignView } from "@/lib/workspace";
import { AccountAvatar } from "@/components/account-avatar";
import { STATUS_META } from "@/components/status";
import { workingState } from "@/components/accounts/working-state";
import { cn } from "@/lib/utils";

/** Per-client summary, shown when looking at all workspaces. */
export function WorkspaceBreakdown({ accounts, campaigns }: { accounts: AccountView[]; campaigns: CampaignView[] }) {
  const { setWorkspaceId } = useWorkspace();
  return (
    <section className="panel">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-semibold">By workspace</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Last 7 days per client</p>
      </header>
      <ul className="divide-y divide-border">
        {TENANTS.map((t) => {
          const accs = accounts.filter((a) => a.tenantId === t.id);
          const week = accs.reduce(
            (acc, a) => {
              const s = sumHistory(a.history, 7);
              return { invites: acc.invites + s.invites, accepted: acc.accepted + s.accepted, replies: acc.replies + s.replies };
            },
            { invites: 0, accepted: 0, replies: 0 },
          );
          const problems = accs.filter((a) => a.status === "limited" || a.status === "disconnected").length;
          const active = campaigns.filter((c) => c.tenantId === t.id && c.status === "active").length;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setWorkspaceId(t.id)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-elevated"
              >
                <span className="num inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-xs text-foreground">
                  {t.short}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-[11px] text-subtle-foreground">
                    {accs.length} profiles · {active} active campaigns
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-sm text-foreground">
                    {week.replies} <span className="text-subtle-foreground">replies</span>
                  </p>
                  <p className={cn("text-[11px]", problems > 0 ? "text-warning" : "text-subtle-foreground")}>
                    {problems > 0 ? `${problems} can't send` : `${pct(week.accepted, week.invites).toFixed(0)}% accept`}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Which profiles are sending right now, shown inside a single workspace. */
export function ProfilesNow({ accounts, now }: { accounts: AccountView[]; now: Date }) {
  return (
    <section className="panel">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-semibold">Profiles right now</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Local time and sending state</p>
      </header>
      <ul className="divide-y divide-border">
        {accounts.map((a) => {
          const ws = workingState(a, now);
          return (
            <li key={a.id}>
              <Link to="/accounts" search={{ account: a.id }} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-elevated">
                <AccountAvatar name={a.name} status={a.status} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{a.name}</p>
                  <p className={cn("truncate text-[11px]", STATUS_META[a.status].text)}>{ws.label}</p>
                </div>
                <span className="num text-xs text-muted-foreground">
                  {a.city} {ws.clock.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { Clock3 } from "lucide-react";

import { isWithinWorkingHours } from "@/lib/account-health";
import type { AccountView } from "@/lib/workspace";
import { STATUS_META, STATUS_ORDER } from "@/components/status";
import { UsageMeter } from "@/components/usage-meter";
import { cn } from "@/lib/utils";

export function FleetHealth({ accounts, now }: { accounts: AccountView[]; now: Date }) {
  const counts = STATUS_ORDER.map((s) => ({ status: s, count: accounts.filter((a) => a.status === s).length }));
  const total = accounts.length || 1;
  const weekly = accounts.reduce(
    (acc, a) => ({ used: acc.used + a.weeklyInvites.used, limit: acc.limit + a.weeklyInvites.limit }),
    { used: 0, limit: 0 },
  );
  const messages = accounts.reduce(
    (acc, a) => ({ used: acc.used + a.dailyMessages.used, limit: acc.limit + a.dailyMessages.limit }),
    { used: 0, limit: 0 },
  );
  const inHours = accounts.filter((a) => a.connection === "connected" && isWithinWorkingHours(a, now)).length;

  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold">Account fleet</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            <span className="num text-foreground">{accounts.length}</span> LinkedIn profiles connected
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 py-1 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          <span className="num text-foreground">{inHours}</span> in working hours now
        </span>
      </div>

      <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-muted">
        {counts.map(({ status, count }) =>
          count > 0 ? (
            <div key={status} className={cn("h-full first:rounded-l-full last:rounded-r-full", STATUS_META[status].bar)} style={{ width: `${(count / total) * 100}%` }} />
          ) : null,
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[...counts].reverse().map(({ status, count }) => {
          const meta = STATUS_META[status];
          return (
            <Link
              key={status}
              to="/accounts"
              search={{ status }}
              className="rounded-lg border border-border bg-elevated/50 p-3 transition-colors hover:border-border-strong hover:bg-elevated"
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", meta.dot)} />
                <span className="text-xs text-muted-foreground">{meta.label}</span>
              </div>
              <p className="num mt-1 text-2xl text-foreground">{count}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <UsageMeter label="Weekly invites" usage={weekly} />
        <UsageMeter label="Messages today" usage={messages} />
      </div>
    </section>
  );
}

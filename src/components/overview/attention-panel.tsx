import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck, OctagonAlert, AlertTriangle, Info } from "lucide-react";

import type { IssueSeverity } from "@/lib/account-health";
import type { AccountView } from "@/lib/workspace";
import { AccountAvatar } from "@/components/account-avatar";
import { SEVERITY_META } from "@/components/status";
import { cn } from "@/lib/utils";

const ICONS: Record<IssueSeverity, typeof Info> = { critical: OctagonAlert, warning: AlertTriangle, info: Info };

export function AttentionPanel({ accounts, showTenant }: { accounts: AccountView[]; showTenant: boolean }) {
  const rows = accounts
    .flatMap((a) => a.issues.map((issue) => ({ account: a, issue })))
    .sort((x, y) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[x.issue.severity] - order[y.issue.severity];
    });
  const critical = rows.filter((r) => r.issue.severity === "critical").length;
  const affected = new Set(rows.map((r) => r.account.id)).size;

  return (
    <section className="panel flex flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">Needs attention</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {rows.length === 0
              ? "Every profile is sending normally."
              : `${rows.length} ${rows.length === 1 ? "issue" : "issues"} across ${affected} ${affected === 1 ? "profile" : "profiles"}${critical ? ` · ${critical} critical` : ""}`}
          </p>
        </div>
        <Link
          to="/accounts"
          search={{ status: "attention" }}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          All accounts <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
          <CircleCheck className="size-8 text-success" />
          <p className="text-sm text-muted-foreground">No limits hit, no disconnected profiles.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.slice(0, 5).map(({ account, issue }) => {
            const meta = SEVERITY_META[issue.severity];
            const Icon = ICONS[issue.severity];
            return (
              <li key={`${account.id}-${issue.code}`}>
                <Link
                  to="/accounts"
                  search={{ account: account.id }}
                  className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-elevated"
                >
                  <span className={cn("mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border", meta.bg, meta.border, meta.text)}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-medium text-foreground">{issue.title}</p>
                      <span className={cn("text-[11px] font-medium", meta.text)}>{meta.label}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{issue.detail}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-subtle-foreground">
                      <AccountAvatar name={account.name} size="sm" />
                      <span className="text-muted-foreground">{account.name}</span>
                      {showTenant && account.tenant && <span>· {account.tenant.name}</span>}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > 5 && (
        <Link to="/accounts" search={{ status: "attention" }} className="border-t border-border px-5 py-3 text-center text-xs text-muted-foreground hover:text-foreground">
          +{rows.length - 5} more
        </Link>
      )}
    </section>
  );
}

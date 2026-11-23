import { Link } from "@tanstack/react-router";

import type { CampaignView } from "@/lib/workspace";
import { AccountAvatar } from "@/components/account-avatar";
import { CampaignHealthBadge } from "@/components/status";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { pct } from "@/lib/metrics";
import { STATUS_META } from "@/components/status";

export function CampaignsTable({ campaigns, showTenant }: { campaigns: CampaignView[]; showTenant: boolean }) {
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">Campaigns</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {campaigns.filter((c) => c.status === "active").length} active · health is based on the profiles sending them
          </p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="bg-elevated text-[12px] text-muted-foreground px-5 py-3 font-medium">Campaign</th>
              <th className="bg-elevated text-[12px] text-muted-foreground px-3 py-3 font-medium">Status</th>
              <th className="bg-elevated text-[12px] text-muted-foreground px-3 py-3 font-medium">Sending from</th>
              <th className="bg-elevated text-[12px] text-muted-foreground px-3 py-3 text-right font-medium">Invites</th>
              <th className="bg-elevated text-[12px] text-muted-foreground px-3 py-3 text-right font-medium">Accept</th>
              <th className="bg-elevated text-[12px] text-muted-foreground px-3 py-3 text-right font-medium">Replies</th>
              <th className="bg-elevated text-[12px] text-muted-foreground px-5 py-3 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <TooltipProvider delayDuration={150}>
              {campaigns.map((c) => {
                const progress = pct(c.completed, c.contacts);
                const blockedSenders = c.senders.filter((s) => s.status === "limited" || s.status === "disconnected");
                return (
                  <tr key={c.id} className="transition-colors hover:bg-accent/50">
                    <td className="px-5 py-3.5">
                      <p className="max-w-[320px] truncate font-medium text-foreground">{c.name}</p>
                      <p className="mt-0.5 text-xs text-subtle-foreground">
                        {showTenant && c.tenant ? `${c.tenant.name} · ` : ""}
                        {c.steps.length} steps · {c.contacts} contacts
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <CampaignHealthBadge health={c.health} />
                      {c.status === "active" && blockedSenders.length > 0 && (
                        <p className="mt-1 text-[11px] text-subtle-foreground">
                          {blockedSenders.length}/{c.senders.length} profiles can't send
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex -space-x-1.5">
                        {c.senders.map((s) => (
                          <Tooltip key={s.id}>
                            <TooltipTrigger asChild>
                              <Link to="/accounts" search={{ account: s.id }} className="rounded-full">
                                <AccountAvatar name={s.name} status={s.status} size="sm" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              {s.name} · {STATUS_META[s.status].label}
                              {s.issues[0] ? ` — ${s.issues[0].title}` : ""}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </td>
                    <td className="num px-3 py-3.5 text-right text-foreground">{c.invites}</td>
                    <td className="num px-3 py-3.5 text-right text-muted-foreground">{pct(c.accepted, c.invites).toFixed(0)}%</td>
                    <td className="num px-3 py-3.5 text-right">
                      <span className={c.replies > 0 ? "text-success" : "text-subtle-foreground"}>{c.replies}</span>
                      <span className="text-subtle-foreground"> · {pct(c.replies, c.messages).toFixed(1)}%</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="num text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </TooltipProvider>
          </tbody>
        </table>
      </div>
      {campaigns.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No campaigns in this workspace yet.</p>}
    </section>
  );
}

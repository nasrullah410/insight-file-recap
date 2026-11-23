import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, MoreHorizontal, Pause, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AccountAvatar } from "@/components/account-avatar";
import { EmptyState, SearchBox, SegmentedTabs, StatStrip, TD, TH } from "@/components/kit";
import { PageHeader } from "@/components/page-header";
import { CampaignHealthBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CampaignStatus } from "@/lib/account-health";
import { CAMPAIGN_SEQUENCES, SEQUENCE_TEMPLATES } from "@/lib/data/sequence-templates";
import { pct } from "@/lib/metrics";
import { pageHead } from "@/lib/seo";
import { useScopedData } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns")({
  head: () => pageHead("Campaigns", "Every LinkedIn outreach campaign with its health, sending profiles, progress and reply rate."),
  component: CampaignsPage,
});

type Filter = "all" | "running" | "paused" | "draft";
const matches = (f: Filter, s: CampaignStatus) => f === "all" || (f === "running" ? s === "active" : s === f);

function CampaignsPage() {
  const { campaigns, showTenant } = useScopedData();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Record<string, CampaignStatus>>({});
  const [removed, setRemoved] = useState<string[]>([]);

  const rows = useMemo(
    () => campaigns.filter((c) => !removed.includes(c.id)).map((c) => ({ ...c, status: overrides[c.id] ?? c.status })),
    [campaigns, overrides, removed],
  );
  const visible = rows.filter((c) => matches(filter, c.status) && (!query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase())));
  const count = (f: Filter) => rows.filter((c) => matches(f, c.status)).length;
  const sum = (k: "contacts" | "invites" | "messages" | "replies") => rows.reduce((a, c) => a + c[k], 0);

  const toggle = (id: string, name: string, status: CampaignStatus) => {
    const next = status === "active" ? "paused" : "active";
    setOverrides((o) => ({ ...o, [id]: next }));
    toast.success(next === "active" ? `Resumed “${name}”` : `Paused “${name}” — queued actions are on hold`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        description="Sequences running from your LinkedIn profiles. Health follows the profiles that send them."
        actions={
          <Button asChild size="sm">
            <Link to="/campaigns/new">
              <Plus /> New campaign
            </Link>
          </Button>
        }
      />

      <StatStrip
        items={[
          { label: "Campaigns", value: rows.length },
          { label: "Running", value: count("running"), tone: "success" },
          { label: "Enrolled prospects", value: sum("contacts").toLocaleString("en-US") },
          { label: "Outreach sent", value: (sum("invites") + sum("messages")).toLocaleString("en-US"), hint: "Invites + messages" },
          { label: "Replies", value: sum("replies"), tone: "primary", hint: `${pct(sum("replies"), sum("messages"))}% of messages` },
        ]}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SegmentedTabs
          label="Filter campaigns"
          value={filter}
          onChange={setFilter}
          options={(["all", "running", "paused", "draft"] as Filter[]).map((f) => ({ value: f, label: f[0]?.toUpperCase() + f.slice(1), count: count(f) }))}
        />
        <SearchBox value={query} onChange={setQuery} placeholder="Search campaigns" />
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No campaigns here" hint="Try another filter, or start a new campaign." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-[13px]">
              <thead className="border-b border-border">
                <tr>
                  <th className={cn(TH, "pl-5")}>Campaign</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Sending from</th>
                  <th className={TH}>Progress</th>
                  <th className={cn(TH, "text-right")}>Invites</th>
                  <th className={cn(TH, "text-right")}>Accept</th>
                  <th className={cn(TH, "text-right")}>Replies</th>
                  <th className={cn(TH, "pr-5")} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((c) => {
                  const seq = SEQUENCE_TEMPLATES.find((s) => s.id === CAMPAIGN_SEQUENCES[c.id]);
                  const progress = pct(c.completed, c.contacts);
                  const health = c.status === "paused" ? "paused" : c.health === "paused" ? "running" : c.health;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-accent/40">
                      <td className={cn(TD, "pl-5")}>
                        <Link to="/campaigns/$campaignId" params={{ campaignId: c.id }} className="block max-w-[340px] truncate font-medium text-foreground hover:text-primary">
                          {c.name}
                        </Link>
                        <p className="mt-0.5 truncate text-[12px] text-subtle-foreground">
                          {showTenant && c.tenant ? `${c.tenant.name} · ` : ""}
                          {seq?.name ?? `${c.steps.length} steps`}
                        </p>
                      </td>
                      <td className={TD}>
                        <CampaignHealthBadge health={health} />
                      </td>
                      <td className={TD}>
                        <div className="flex -space-x-1.5">
                          {c.senders.map((s) => (
                            <AccountAvatar key={s.id} name={s.name} status={s.status} size="sm" />
                          ))}
                        </div>
                      </td>
                      <td className={TD}>
                        <div className="w-36">
                          <div className="flex justify-between text-[12px]">
                            <span className="num">{c.completed}/{c.contacts}</span>
                            <span className="num text-subtle-foreground">{progress}%</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className={cn(TD, "num text-right")}>{c.invites}</td>
                      <td className={cn(TD, "num text-right")}>{c.invites ? `${pct(c.accepted, c.invites)}%` : "—"}</td>
                      <td className={cn(TD, "num text-right font-medium")}>{c.replies}</td>
                      <td className={cn(TD, "pr-5 text-right")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${c.name}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => toggle(c.id, c.name, c.status)}>
                              {c.status === "active" ? <Pause /> : <Play />}
                              {c.status === "active" ? "Pause" : "Resume"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.success(`Draft copy of “${c.name}” created`, { description: "Prospects are not copied." })}>
                              <Copy /> Duplicate as draft
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => {
                                setRemoved((r) => [...r, c.id]);
                                toast.success(`Deleted “${c.name}”`, { description: "Pending actions for this campaign were cancelled." });
                              }}
                            >
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

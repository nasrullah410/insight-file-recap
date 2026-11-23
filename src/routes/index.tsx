import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { ActivityChart } from "@/components/overview/activity-chart";
import { AttentionPanel } from "@/components/overview/attention-panel";
import { CampaignsTable } from "@/components/overview/campaigns-table";
import { ActivityFeed, RepliesFeed } from "@/components/overview/feeds";
import { FleetHealth } from "@/components/overview/fleet-health";
import { FunnelCard } from "@/components/overview/funnel-card";
import { KpiGrid } from "@/components/overview/kpi-grid";
import { ProfilesNow, WorkspaceBreakdown } from "@/components/overview/workspace-breakdown";
import { aggregateSeries, aggregateTotals, RANGE_DAYS, type RangeKey } from "@/lib/metrics";
import { useScopedData } from "@/lib/workspace";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  range: z.enum(["7d", "14d"]).optional().catch(undefined),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Overview — Convrtln Outreach OS" },
      { name: "description", content: "Live view of every LinkedIn campaign, profile health and outreach result across all your workspaces." },
      { property: "og:title", content: "Overview — Convrtln Outreach OS" },
      { property: "og:description", content: "Live view of every LinkedIn campaign, profile health and outreach result across all your workspaces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function RangeToggle({ value }: { value: RangeKey }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
      {(["7d", "14d"] as const).map((r) => (
        <Link
          key={r}
          to="/"
          search={{ range: r }}
          className={cn(
            "rounded-[5px] px-3 py-1 text-[13px] font-medium transition-colors",
            value === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Last {r === "7d" ? "7" : "14"} days
        </Link>
      ))}
    </div>
  );
}

function Overview() {
  const { range: rangeParam } = Route.useSearch();
  const range: RangeKey = rangeParam ?? "7d";
  const days = RANGE_DAYS[range];
  const { accounts, campaigns, replies, activity, showTenant, now } = useScopedData();

  const current = aggregateTotals(accounts, days);
  const previous = aggregateTotals(accounts, days, days);
  const series = aggregateSeries(accounts, days);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach overview"
        description="What's happening in your campaigns right now, and which LinkedIn profiles need you."
        actions={<RangeToggle value={range} />}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <AttentionPanel accounts={accounts} showTenant={showTenant} />
        </div>
        <div className="space-y-6 xl:col-span-2">
          <FleetHealth accounts={accounts} now={now} />
          {showTenant ? <WorkspaceBreakdown accounts={accounts} campaigns={campaigns} /> : <ProfilesNow accounts={accounts} now={now} />}
        </div>
      </div>

      <KpiGrid current={current} previous={previous} series={series} rangeLabel={`last ${days} days`} />

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="panel p-5 xl:col-span-2">
          <h2 className="text-[15px] font-semibold">Daily activity</h2>
          <p className="mt-0.5 mb-4 text-[13px] text-muted-foreground">All profiles, last {days} days</p>
          <ActivityChart series={series} />
        </section>
        <section className="panel p-5">
          <h2 className="text-[15px] font-semibold">Conversion funnel</h2>
          <p className="mt-0.5 mb-5 text-[13px] text-muted-foreground">Last {days} days</p>
          <FunnelCard invites={current.invites} accepted={current.accepted} messages={current.messages} replies={current.replies} />
        </section>
      </div>

      <CampaignsTable campaigns={campaigns} showTenant={showTenant} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RepliesFeed replies={replies} now={now} />
        <ActivityFeed activity={activity} now={now} />
      </div>
    </div>
  );
}

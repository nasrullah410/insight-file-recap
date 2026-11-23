import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Pause, Play, Save } from "lucide-react";
import { toast } from "sonner";

import { AccountAvatar } from "@/components/account-avatar";
import { SequenceEditor } from "@/components/campaigns/sequence-editor";
import { EmptyState, PersonAvatar, SearchBox, StatStrip, TD, TH } from "@/components/kit";
import { ScorePill, StageBadge } from "@/components/stage";
import { CampaignHealthBadge, StatusBadge } from "@/components/status";
import { MiniMeter } from "@/components/usage-meter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CAMPAIGNS } from "@/lib/demo-data";
import { LOG_KIND_LABEL, ACTIVITY_LOG } from "@/lib/data/activity-log";
import { fullName, PROSPECTS } from "@/lib/data/prospects";
import { CAMPAIGN_SEQUENCES, SEQUENCE_TEMPLATES, type SequenceStep } from "@/lib/data/sequence-templates";
import { pct } from "@/lib/metrics";
import { pageHead } from "@/lib/seo";
import { accountName, ALL_WORKSPACES, formatStamp, relativeTime, useScopedData, useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns_/$campaignId")({
  loader: ({ params }) => {
    const campaign = CAMPAIGNS.find((c) => c.id === params.campaignId);
    if (!campaign) throw notFound();
    return { name: campaign.name };
  },
  head: ({ loaderData }) => pageHead(loaderData?.name ?? "Campaign", "Sequence, prospects, sending profiles and activity for this LinkedIn campaign."),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const { campaigns, now } = useScopedData();
  const { setWorkspaceId } = useWorkspace();
  const campaign = campaigns.find((c) => c.id === campaignId);
  const seq = SEQUENCE_TEMPLATES.find((s) => s.id === CAMPAIGN_SEQUENCES[campaignId]);
  const [steps, setSteps] = useState<SequenceStep[]>(seq?.steps ?? []);
  const [dirty, setDirty] = useState(false);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");

  const prospects = useMemo(() => PROSPECTS.filter((p) => p.campaignId === campaignId), [campaignId]);
  const log = useMemo(() => ACTIVITY_LOG.filter((e) => e.campaignId === campaignId).slice(0, 40), [campaignId]);

  if (!campaign) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          title="This campaign is in another workspace"
          hint="Switch to All workspaces to open it."
        />
        <div className="text-center">
          <Button size="sm" variant="soft" onClick={() => setWorkspaceId(ALL_WORKSPACES)}>
            Show all workspaces
          </Button>
        </div>
      </div>
    );
  }

  const isPaused = paused ?? campaign.status === "paused";
  const health = isPaused ? "paused" : campaign.health === "paused" ? "running" : campaign.health;
  const q = query.trim().toLowerCase();
  const visibleProspects = prospects.filter((p) => !q || fullName(p).toLowerCase().includes(q) || p.company.toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <BackLink />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] leading-tight font-semibold">{campaign.name}</h1>
            <CampaignHealthBadge health={health} />
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {campaign.tenant?.name} · started {campaign.startedAt} · {seq?.name ?? `${campaign.steps.length} steps`}
          </p>
        </div>
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            setPaused(!isPaused);
            toast.success(isPaused ? "Campaign resumed" : "Campaign paused — queued actions are on hold");
          }}
        >
          {isPaused ? <Play /> : <Pause />}
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>

      <StatStrip
        items={[
          { label: "Contacts", value: campaign.contacts, hint: `${pct(campaign.completed, campaign.contacts)}% finished` },
          { label: "Invites sent", value: campaign.invites },
          { label: "Accepted", value: campaign.accepted, hint: campaign.invites ? `${pct(campaign.accepted, campaign.invites)}% accept rate` : "—", tone: "info" },
          { label: "Messaged", value: campaign.messages },
          { label: "Replied", value: campaign.replies, hint: `${pct(campaign.replies, campaign.messages)}% reply rate`, tone: "success" },
        ]}
      />

      <Tabs defaultValue="sequence">
        <TabsList>
          <TabsTrigger value="sequence">Sequence</TabsTrigger>
          <TabsTrigger value="prospects">Prospects · {prospects.length}</TabsTrigger>
          <TabsTrigger value="senders">Sending profiles · {campaign.senders.length}</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="sequence" className="mt-4">
          <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
            <div className="max-w-3xl">
              <SequenceEditor
                steps={steps}
                tenantId={campaign.tenantId}
                onChange={(s) => {
                  setSteps(s);
                  setDirty(true);
                }}
              />
            </div>
            <aside className="panel h-fit space-y-3 p-4 text-[13px]">
              <p className="font-semibold">Sequence settings</p>
              <p className="text-muted-foreground">Edits apply to contacts who haven't reached that step yet.</p>
              <Button
                size="sm"
                className="w-full"
                disabled={!dirty}
                onClick={() => {
                  setDirty(false);
                  toast.success("Sequence saved");
                }}
              >
                <Save /> Save changes
              </Button>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="prospects" className="mt-4 space-y-3">
          <SearchBox value={query} onChange={setQuery} placeholder="Search name or company" />
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-[13px]">
                <thead className="border-b border-border">
                  <tr>
                    <th className={cn(TH, "pl-5")}>Prospect</th>
                    <th className={TH}>Company</th>
                    <th className={TH}>Score</th>
                    <th className={TH}>Stage</th>
                    <th className={TH}>Sending from</th>
                    <th className={cn(TH, "pr-5")}>Last touch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleProspects.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/40">
                      <td className={cn(TD, "pl-5")}>
                        <Link to="/prospects" search={{ prospect: p.id }} className="flex items-center gap-2.5 hover:text-primary">
                          <PersonAvatar name={fullName(p)} size="sm" />
                          <span>
                            <span className="block font-medium">{fullName(p)}</span>
                            <span className="block text-[12px] text-subtle-foreground">{p.title}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={TD}>{p.company}</td>
                      <td className={TD}><ScorePill score={p.score} /></td>
                      <td className={TD}><StageBadge stage={p.stage} /></td>
                      <td className={cn(TD, "text-muted-foreground")}>{p.accountId ? accountName(p.accountId) : "—"}</td>
                      <td className={cn(TD, "pr-5 text-muted-foreground")}>{p.lastTouchAt ? relativeTime(p.lastTouchAt, now) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibleProspects.length === 0 && <p className="p-8 text-center text-[13px] text-muted-foreground">No prospects match.</p>}
          </div>
        </TabsContent>

        <TabsContent value="senders" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {campaign.senders.map((a) => (
              <div key={a.id} className="panel p-4">
                <div className="flex items-start gap-3">
                  <AccountAvatar name={a.name} status={a.status} />
                  <div className="min-w-0 flex-1">
                    <Link to="/accounts/$accountId" params={{ accountId: a.id }} className="font-medium hover:text-primary">{a.name}</Link>
                    <p className="truncate text-[12px] text-subtle-foreground">{a.headline}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-3 flex gap-6">
                  <div><p className="mb-1 text-[11px] text-subtle-foreground">Weekly invites</p><MiniMeter usage={a.weeklyInvites} /></div>
                  <div><p className="mb-1 text-[11px] text-subtle-foreground">Messages today</p><MiniMeter usage={a.dailyMessages} /></div>
                  <div><p className="mb-1 text-[11px] text-subtle-foreground">InMail</p><MiniMeter usage={a.inmailCredits} /></div>
                </div>
                {a.issues[0] && <p className="mt-3 rounded-md bg-warning/10 px-2.5 py-1.5 text-[12px] text-warning">{a.issues[0].title}</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="panel divide-y divide-border">
            {log.length === 0 && <p className="p-8 text-center text-[13px] text-muted-foreground">No activity yet.</p>}
            {log.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[13px]">
                <span className={cn("size-1.5 rounded-full", e.status === "failed" ? "bg-destructive" : "bg-success")} />
                <span className="font-medium">{LOG_KIND_LABEL[e.kind]}</span>
                <span className="text-muted-foreground">{e.prospectName}</span>
                <span className="text-subtle-foreground">via {accountName(e.accountId)}</span>
                {e.detail && <span className={cn("text-[12px]", e.status === "failed" ? "text-destructive" : "text-subtle-foreground")}>· {e.detail}</span>}
                <span className="num ml-auto text-[12px] text-subtle-foreground">{formatStamp(e.at)}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-3.5" /> Campaigns
    </Link>
  );
}

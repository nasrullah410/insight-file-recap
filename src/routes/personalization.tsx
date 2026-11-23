import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, RefreshCw, SkipForward, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, HighlightedMessage, PersonAvatar } from "@/components/kit";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERSONALIZATION, REASON_LABEL } from "@/lib/data/personalization";
import { fullName, prospectById } from "@/lib/data/prospects";
import { templateById } from "@/lib/data/templates";
import { missingVariables, renderMessage, tokenize, type VariableValues } from "@/lib/message-vars";
import { pageHead } from "@/lib/seo";
import { accountName, campaignName, relativeTime, useInScope, useScopedData } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/personalization")({
  head: () => pageHead("Needs personalization", "Messages paused because a variable is missing or the AI wasn't confident — review, edit and queue them."),
  component: PersonalizationPage,
});

const REGEN = [
  "Saw your team just crossed 50 people — that's usually when onboarding starts to creak.",
  "Your talk at the SaaS meetup on pricing pages was spot on.",
  "Congrats on the new role — big move from consulting!",
];

function PersonalizationPage() {
  const scope = useInScope();
  const { now } = useScopedData();
  const [done, setDone] = useState<string[]>([]);
  const items = useMemo(() => scope(PERSONALIZATION).filter((i) => !done.includes(i.id)), [scope, done]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [regen, setRegen] = useState(0);

  const active = items.find((i) => i.id === activeId) ?? items[0];
  const prospect = active ? prospectById(active.prospectId) : undefined;
  const template = active ? templateById(active.templateId) : undefined;

  const finish = (id: string, msg: string) => {
    setDone((d) => [...d, id]);
    setActiveId(null);
    toast.success(msg);
  };

  if (!active || !prospect || !template) {
    return (
      <div className="space-y-5">
        <PageHeader title="Needs personalization" description="Messages waiting for a human touch before they send." />
        <EmptyState icon={<CheckCircle2 />} title="All caught up" hint="Nothing is waiting for personalization in this workspace." />
      </div>
    );
  }

  const icebreaker = edits[active.id] ?? active.aiSuggestion;
  const values: VariableValues = {
    first_name: prospect.firstName,
    last_name: prospect.lastName,
    company: prospect.company,
    job_title: prospect.title,
    location: prospect.location,
    industry: prospect.industry,
    icebreaker: renderMessage(icebreaker, { company: prospect.company }),
    sender_name: accountName(active.accountId).split(" ")[0] ?? "",
  };
  const missing = missingVariables(template.body, values);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Needs personalization"
        description="These messages paused because a variable was empty or the AI wasn't sure. Fix the line, then queue it."
        actions={<Button size="sm" variant="soft" onClick={() => toast.success(`Exported ${items.length} rows to CSV`)}><Download /> Export CSV</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <ul className="panel max-h-[680px] divide-y divide-border overflow-y-auto">
          {items.map((i) => {
            const p = prospectById(i.prospectId);
            return (
              <li key={i.id}>
                <button type="button" onClick={() => setActiveId(i.id)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors", i.id === active.id ? "bg-accent" : "hover:bg-accent/40")}>
                  <PersonAvatar name={p ? fullName(p) : "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{p ? fullName(p) : "Unknown"}</p>
                    <p className="truncate text-[12px] text-subtle-foreground">{i.stepLabel} · {campaignName(i.campaignId)}</p>
                    <Badge variant={i.reason === "missing_icebreaker" ? "warning" : "muted"} className="mt-1.5">{REASON_LABEL[i.reason]}</Badge>
                  </div>
                  <span className="text-[11px] text-subtle-foreground">{relativeTime(i.flaggedAt, now)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="panel space-y-4 p-5">
            <div className="flex items-center gap-3">
              <PersonAvatar name={fullName(prospect)} size="lg" />
              <div className="min-w-0">
                <Link to="/prospects" search={{ prospect: prospect.id }} className="font-semibold hover:text-primary">{fullName(prospect)}</Link>
                <p className="text-[13px] text-muted-foreground">{prospect.title}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-[12px] text-subtle-foreground">Company</dt><dd>{prospect.company}</dd></div>
              <div><dt className="text-[12px] text-subtle-foreground">Industry</dt><dd>{prospect.industry}</dd></div>
              <div><dt className="text-[12px] text-subtle-foreground">Location</dt><dd>{prospect.location}</dd></div>
              <div><dt className="text-[12px] text-subtle-foreground">Sends from</dt><dd>{accountName(active.accountId)}</dd></div>
            </dl>
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">Template · {template.name}</p>
              <div className="rounded-md border border-border bg-elevated p-3">
                <HighlightedMessage parts={tokenize(template.body)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ice">Icebreaker</Label>
                <span className="flex items-center gap-1 text-[11px] text-subtle-foreground"><Sparkles className="size-3" />AI confidence {Math.round(active.confidence * 100)}%</span>
              </div>
              <Input id="ice" value={icebreaker} onChange={(e) => setEdits((x) => ({ ...x, [active.id]: e.target.value }))} className="text-[13px]" />
            </div>
          </section>

          <section className="panel flex flex-col p-5">
            <p className="mb-2 text-[12px] font-medium text-muted-foreground">What {prospect.firstName} will receive</p>
            <div className="flex-1 rounded-lg border border-border bg-card p-4">
              {template.subject && <p className="mb-2 text-[13px] font-semibold">{renderMessage(template.subject, values)}</p>}
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{renderMessage(template.body, values)}</p>
            </div>
            {missing.length > 0 && <p className="mt-3 rounded-md bg-warning/10 px-3 py-2 text-[12px] text-warning">Still missing: {missing.map((m) => `{{${m}}}`).join(", ")}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  setEdits((x) => ({ ...x, [active.id]: REGEN[regen % REGEN.length] ?? "" }));
                  setRegen((r) => r + 1);
                }}
              >
                <RefreshCw /> Regenerate AI suggestion
              </Button>
              <Button size="sm" variant="soft" onClick={() => finish(active.id, `Skipped ${prospect.firstName} — removed from this step`)}>
                <SkipForward /> Skip contact
              </Button>
              <Button size="sm" className="ml-auto" disabled={missing.length > 0} onClick={() => finish(active.id, `Queued for ${prospect.firstName}`)}>
                Approve & queue
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

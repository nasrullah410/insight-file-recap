import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState, HighlightedMessage, SearchBox, SegmentedTabs } from "@/components/kit";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROSPECTS } from "@/lib/data/prospects";
import { SEQUENCE_TEMPLATES, STEP_META } from "@/lib/data/sequence-templates";
import { TEMPLATE_KIND_LABEL, TEMPLATES, type MessageTemplate, type TemplateKind } from "@/lib/data/templates";
import { INVITE_NOTE_LIMIT, missingVariables, renderMessage, tokenize, VARIABLES, type VariableValues } from "@/lib/message-vars";
import { pageHead } from "@/lib/seo";
import { relativeTime, useInScope, useScopedData } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/templates")({
  validateSearch: z.object({ template: z.string().optional().catch(undefined) }),
  head: () => pageHead("Templates", "Reusable invite notes, messages, InMails and voice scripts with personalization variables."),
  component: TemplatesPage,
});

type KindFilter = "all" | TemplateKind;
const KINDS = Object.keys(TEMPLATE_KIND_LABEL) as TemplateKind[];

const sample = PROSPECTS[1];
const SAMPLE_VALUES: VariableValues = sample
  ? { first_name: sample.firstName, last_name: sample.lastName, company: sample.company, job_title: sample.title, location: sample.location, industry: sample.industry, icebreaker: sample.icebreaker, sender_name: "Sarah" }
  : {};

const blank = (tenantId: string): MessageTemplate => ({ id: "new", tenantId, name: "", kind: "message", body: "", tags: [], uses: 0, replyRate: 0, updatedAt: new Date().toISOString() });

function TemplatesPage() {
  const { template: openId } = Route.useSearch();
  const navigate = useNavigate({ from: "/templates" });
  const scope = useInScope();
  const { now, tenant } = useScopedData();
  const templates = useMemo(() => scope(TEMPLATES), [scope]);
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<MessageTemplate | null>(null);

  const q = query.trim().toLowerCase();
  const visible = templates.filter((t) => (kind === "all" || t.kind === kind) && (!q || t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.tags.some((g) => g.includes(q))));
  const opened = draft ?? templates.find((t) => t.id === openId) ?? null;

  const close = () => {
    setDraft(null);
    if (openId) void navigate({ search: { template: undefined } });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        description="Messages your campaigns and SDRs reuse. Variables fill in per prospect."
        actions={<Button size="sm" onClick={() => setDraft(blank(tenant?.id ?? "hq"))}><Plus /> New template</Button>}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SegmentedTabs
          label="Template type"
          value={kind}
          onChange={setKind}
          options={[{ value: "all" as KindFilter, label: "All", count: templates.length }, ...KINDS.map((k) => ({ value: k as KindFilter, label: TEMPLATE_KIND_LABEL[k], count: templates.filter((t) => t.kind === k).length }))]}
        />
        <SearchBox value={query} onChange={setQuery} placeholder="Search templates or tags" />
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No templates match" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((t) => (
            <button key={t.id} type="button" onClick={() => navigate({ search: { template: t.id } })} className="panel flex flex-col p-4 text-left transition-shadow hover:shadow-glow">
              <div className="flex items-center gap-2">
                <Badge variant="signal">{TEMPLATE_KIND_LABEL[t.kind]}</Badge>
                {t.tags.map((g) => <Badge key={g} variant="muted">{g}</Badge>)}
              </div>
              <p className="mt-2.5 font-medium">{t.name}</p>
              <HighlightedMessage parts={tokenize(t.body)} className="mt-1.5 line-clamp-3 text-muted-foreground" />
              <div className="mt-auto flex items-center gap-4 pt-3 text-[12px] text-subtle-foreground">
                <span><span className="num font-medium text-foreground">{t.uses}</span> sent</span>
                {t.kind !== "invite_note" && t.kind !== "comment" && <span><span className="num font-medium text-foreground">{(t.replyRate * 100).toFixed(1)}%</span> reply rate</span>}
                <span className="ml-auto">Edited {relativeTime(t.updatedAt, now)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold">Sequence starters</h2>
          <p className="text-[13px] text-muted-foreground">Pick one when you create a campaign — every step can be edited.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SEQUENCE_TEMPLATES.map((s) => (
            <div key={s.id} className="panel p-4">
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{s.description}</p>
              <p className="mt-3 text-[12px] text-subtle-foreground">{s.steps.filter((x) => x.type !== "wait").map((x) => STEP_META[x.type].label).join(" → ")}</p>
            </div>
          ))}
        </div>
      </section>

      {opened && <TemplateEditor key={opened.id} template={opened} onClose={close} />}
    </div>
  );
}

function TemplateEditor({ template, onClose }: { template: MessageTemplate; onClose: () => void }) {
  const [t, setT] = useState(template);
  const missing = missingVariables(t.body, SAMPLE_VALUES);
  const tooLong = t.kind === "invite_note" && renderMessage(t.body, SAMPLE_VALUES).length > INVITE_NOTE_LIMIT;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template.id === "new" ? "New template" : "Edit template"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tname">Name</Label>
              <Input id="tname" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={t.kind} onValueChange={(v) => setT({ ...t, kind: v as TemplateKind })}>
                <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
                <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{TEMPLATE_KIND_LABEL[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {t.kind === "inmail" && (
              <div className="space-y-1.5">
                <Label htmlFor="tsubj">Subject</Label>
                <Input id="tsubj" value={t.subject ?? ""} onChange={(e) => setT({ ...t, subject: e.target.value })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="tbody">Message</Label>
              <Textarea id="tbody" rows={7} value={t.body} onChange={(e) => setT({ ...t, body: e.target.value })} className="text-[13px]" />
              <div className="flex flex-wrap gap-1">
                {VARIABLES.map((v) => (
                  <button key={v} type="button" onClick={() => setT({ ...t, body: `${t.body}{{${v}}}` })} className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:border-primary hover:text-primary">
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-muted-foreground">Preview for {sample?.firstName} {sample?.lastName}</p>
            <div className="rounded-lg border border-border bg-elevated p-4">
              {t.subject && t.kind === "inmail" && <p className="mb-2 text-[13px] font-medium">{renderMessage(t.subject, SAMPLE_VALUES)}</p>}
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{renderMessage(t.body, SAMPLE_VALUES) || <span className="text-subtle-foreground">Start typing…</span>}</p>
            </div>
            {t.kind === "invite_note" && (
              <p className={cn("num text-right text-[12px]", tooLong ? "text-destructive" : "text-subtle-foreground")}>
                {renderMessage(t.body, SAMPLE_VALUES).length}/{INVITE_NOTE_LIMIT} characters
              </p>
            )}
            {missing.length > 0 && (
              <p className="rounded-md bg-warning/10 px-3 py-2 text-[12px] text-warning">
                No value for {missing.map((m) => `{{${m}}}`).join(", ")} on this prospect — it would go to Needs personalization.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="soft" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!t.name.trim() || !t.body.trim() || tooLong}
            onClick={() => {
              toast.success(`Template “${t.name}” saved`);
              onClose();
            }}
          >
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

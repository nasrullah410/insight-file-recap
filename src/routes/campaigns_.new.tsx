import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, FileUp, Rocket } from "lucide-react";
import { toast } from "sonner";

import { AccountAvatar } from "@/components/account-avatar";
import { SequenceEditor } from "@/components/campaigns/sequence-editor";
import { StatusBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TENANTS } from "@/lib/demo-data";
import { LISTS, PROSPECTS } from "@/lib/data/prospects";
import { SEQUENCE_TEMPLATES, STEP_META, type SequenceStep } from "@/lib/data/sequence-templates";
import { pageHead } from "@/lib/seo";
import { ALL_WORKSPACES, useScopedData, useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns_/new")({
  head: () => pageHead("New campaign", "Create a LinkedIn outreach campaign: pick sending profiles, an audience and a sequence."),
  component: NewCampaignPage,
});

const STEPS = ["Basics", "Sending profiles", "Audience", "Sequence", "Review"] as const;

function NewCampaignPage() {
  const { workspaceId } = useWorkspace();
  const { accounts } = useScopedData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tenantId, setTenantId] = useState(workspaceId === ALL_WORKSPACES ? "hq" : workspaceId);
  const [approval, setApproval] = useState(true);
  const [senderIds, setSenderIds] = useState<string[]>([]);
  const [listIds, setListIds] = useState<string[]>([]);
  const [seqId, setSeqId] = useState(SEQUENCE_TEMPLATES[2]?.id ?? "");
  const [steps, setSteps] = useState<SequenceStep[]>(SEQUENCE_TEMPLATES[2]?.steps ?? []);

  const tenantAccounts = accounts.filter((a) => a.tenantId === tenantId);
  const tenantLists = LISTS.filter((l) => l.tenantId === tenantId);
  const listCount = (id: string) => PROSPECTS.filter((p) => p.listId === id).length;
  const audience = useMemo(() => listIds.reduce((n, id) => n + listCount(id), 0), [listIds]);
  const seq = SEQUENCE_TEMPLATES.find((s) => s.id === seqId);

  const canNext = [name.trim().length > 2, senderIds.length > 0, listIds.length > 0, steps.length > 0, true][step];
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const finish = (launch: boolean) => {
    toast.success(launch ? `“${name}” launched` : `“${name}” saved as draft`, {
      description: launch ? `${audience} prospects will start from ${senderIds.length} profile(s) in working hours.` : "You can launch it from Campaigns.",
    });
    void navigate({ to: "/campaigns" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Campaigns
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold">New campaign</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Five quick steps. Nothing sends until you launch.</p>
      </div>

      <ol className="panel flex flex-wrap gap-1 p-1.5">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors",
                i === step ? "bg-accent text-primary" : i < step ? "text-foreground hover:bg-accent/50" : "text-subtle-foreground",
              )}
            >
              <span className={cn("inline-flex size-5 items-center justify-center rounded-full border text-[11px]", i < step ? "border-primary bg-primary text-primary-foreground" : i === step ? "border-primary" : "border-border-strong")}>
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <section className="panel p-5">
        {step === 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cname">Campaign name</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fintech Founders — UK" />
            </div>
            <div className="space-y-1.5">
              <Label>Workspace</Label>
              <Select
                value={tenantId}
                onValueChange={(v) => {
                  setTenantId(v);
                  setSenderIds([]);
                  setListIds([]);
                }}
                disabled={workspaceId !== ALL_WORKSPACES}
              >
                <SelectTrigger aria-label="Workspace"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TENANTS.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-[13px] font-medium">SDR approves messages</p>
                <p className="text-[12px] text-muted-foreground">AI drafts land in the SDR Task Center before sending.</p>
              </div>
              <Switch checked={approval} onCheckedChange={setApproval} aria-label="SDR approves messages" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <p className="mb-3 text-[13px] text-muted-foreground">Prospects are split evenly between the profiles you pick. Disconnected profiles can't be used.</p>
            {tenantAccounts.map((a) => {
              const disabled = a.status === "disconnected";
              const checked = senderIds.includes(a.id);
              return (
                <label key={a.id} className={cn("flex items-center gap-3 rounded-md border p-3 transition-colors", checked ? "border-primary bg-accent/50" : "border-border", disabled ? "opacity-50" : "cursor-pointer hover:bg-accent/30")}>
                  <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => setSenderIds((s) => toggle(s, a.id))} aria-label={a.name} />
                  <AccountAvatar name={a.name} status={a.status} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{a.name}</p>
                    <p className="truncate text-[12px] text-subtle-foreground">{a.headline}</p>
                  </div>
                  <span className="num hidden text-[12px] text-muted-foreground sm:block">{a.weeklyInvites.limit - a.weeklyInvites.used} invites left this week</span>
                  <StatusBadge status={a.status} />
                </label>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">Choose one or more saved lists.</p>
              <Button size="sm" variant="soft" onClick={() => toast("CSV import opens from Prospects & lists")}>
                <FileUp /> Import CSV
              </Button>
            </div>
            {tenantLists.map((l) => {
              const checked = listIds.includes(l.id);
              return (
                <label key={l.id} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/30", checked ? "border-primary bg-accent/50" : "border-border")}>
                  <Checkbox checked={checked} onCheckedChange={() => setListIds((s) => toggle(s, l.id))} aria-label={l.name} />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium">{l.name}</p>
                    <p className="text-[12px] text-subtle-foreground">{l.source}</p>
                  </div>
                  <span className="num text-[13px] font-medium">{listCount(l.id)}</span>
                  <span className="text-[12px] text-muted-foreground">prospects</span>
                </label>
              );
            })}
            <p className="pt-2 text-right text-[13px]">Audience: <span className="num font-semibold">{audience}</span> prospects</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="grid gap-2 md:grid-cols-3">
              {SEQUENCE_TEMPLATES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSeqId(s.id);
                    setSteps(s.steps);
                  }}
                  className={cn("rounded-md border p-3 text-left transition-colors", seqId === s.id ? "border-primary bg-accent/50" : "border-border hover:bg-accent/30")}
                >
                  <p className="text-[13px] font-medium">{s.name}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{s.description}</p>
                </button>
              ))}
            </div>
            <SequenceEditor steps={steps} tenantId={tenantId} onChange={setSteps} />
          </div>
        )}

        {step === 4 && (
          <dl className="grid gap-4 text-[13px] md:grid-cols-2">
            <Review label="Name" value={name} />
            <Review label="Workspace" value={TENANTS.find((t) => t.id === tenantId)?.name ?? ""} />
            <Review label="Sending profiles" value={tenantAccounts.filter((a) => senderIds.includes(a.id)).map((a) => a.name).join(", ")} />
            <Review label="Audience" value={`${audience} prospects from ${listIds.length} list(s)`} />
            <Review label="Sequence" value={`${seq?.name ?? "Custom"} · ${steps.filter((s) => s.type !== "wait").map((s) => STEP_META[s.type].label).join(" → ")}`} />
            <Review label="Approval" value={approval ? "SDR approves AI drafts" : "Sends automatically"} />
          </dl>
        )}
      </section>

      <div className="flex justify-between">
        <Button variant="soft" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="soft" onClick={() => finish(false)}>Save as draft</Button>
            <Button size="sm" onClick={() => finish(true)}><Rocket /> Launch campaign</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}

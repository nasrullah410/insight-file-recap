import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, CheckSquare, RefreshCw, Send, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AccountAvatar } from "@/components/account-avatar";
import { EmptyState, PersonAvatar, SegmentedTabs } from "@/components/kit";
import { PageHeader } from "@/components/page-header";
import { ScorePill } from "@/components/stage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fullName, prospectById } from "@/lib/data/prospects";
import { TASK_TABS, TASK_TYPE_LABEL, TASKS, type SdrTask, type TaskStatus } from "@/lib/data/tasks";
import { INVITE_NOTE_LIMIT } from "@/lib/message-vars";
import { pageHead } from "@/lib/seo";
import { isOverdue, sortTasks } from "@/lib/task-rules";
import { campaignName, relativeAny, useInScope, useScopedData } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  validateSearch: z.object({ task: z.string().optional().catch(undefined) }),
  head: () => pageHead("SDR Task Center", "Review AI-drafted comments, InMails, invites and messages, then approve, regenerate or skip."),
  component: TasksPage,
});

const ALTERNATIVES = [
  (f: string) => `Hi ${f} — your recent post caught my eye. Would love to hear how you're thinking about this next quarter.`,
  (f: string) => `${f}, quick question: what's the one outbound channel that's actually working for your team right now?`,
  (f: string) => `Hey ${f}, short and sweet — open to a 15-minute swap of notes next week?`,
];

type StatusFilter = TaskStatus;

function TasksPage() {
  const { task: taskId } = Route.useSearch();
  const navigate = useNavigate({ from: "/tasks" });
  const scope = useInScope();
  const { accounts, now } = useScopedData();
  const [tasks, setTasks] = useState<SdrTask[]>(TASKS);
  const scoped = useMemo(() => scope(tasks), [scope, tasks]);
  const initialTab = TASK_TABS.find((t) => t.types.includes(scoped.find((x) => x.id === taskId)?.type ?? "post_comment"))?.id ?? "post_comment";
  const [tab, setTab] = useState(initialTab);
  const [status, setStatus] = useState<StatusFilter>("pending_approval");
  const [regen, setRegen] = useState(0);

  const tabDef = TASK_TABS.find((t) => t.id === tab) ?? TASK_TABS[0];
  const inTab = scoped.filter((t) => tabDef?.types.includes(t.type));
  const list = sortTasks(inTab.filter((t) => t.status === status), now);
  const active = list.find((t) => t.id === taskId) ?? list[0];
  const prospect = active ? prospectById(active.prospectId) : undefined;
  const sender = active ? accounts.find((a) => a.id === active.accountId) : undefined;
  const pendingCount = (types: string[]) => scoped.filter((t) => t.status === "pending_approval" && types.includes(t.type)).length;

  const update = (id: string, patch: Partial<SdrTask>) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const advance = () => {
    const next = list.find((t) => t.id !== active?.id);
    void navigate({ search: { task: next?.id } });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="SDR Task Center" description="Steps that need a human: check the AI draft, tweak it, then approve. Sends from the prospect's assigned profile." />

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TASK_TABS.map((t, i) => {
          const n = pendingCount(t.types);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                void navigate({ search: { task: undefined } });
              }}
              className={cn("relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-[13px] font-medium transition-colors", tab === t.id ? "text-primary after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <span className="num text-[11px] text-subtle-foreground">{i + 1}</span>
              {t.label}
              {n > 0 && <span className="num rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">{n}</span>}
            </button>
          );
        })}
      </div>

      <SegmentedTabs
        label="Task status"
        value={status}
        onChange={(v) => {
          setStatus(v);
          void navigate({ search: { task: undefined } });
        }}
        options={[
          { value: "pending_approval" as StatusFilter, label: "To review", count: inTab.filter((t) => t.status === "pending_approval").length },
          { value: "completed" as StatusFilter, label: "Approved & sent", count: inTab.filter((t) => t.status === "completed").length },
          { value: "skipped" as StatusFilter, label: "Skipped", count: inTab.filter((t) => t.status === "skipped").length },
        ]}
      />

      {list.length === 0 || !active || !prospect ? (
        <EmptyState icon={<CheckSquare />} title="Nothing here" hint={status === "pending_approval" ? "You're all caught up on this step." : "No tasks in this view yet."} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <ul className="panel max-h-[640px] divide-y divide-border overflow-y-auto">
            {list.map((t) => {
              const p = prospectById(t.prospectId);
              const overdue = isOverdue(t, now);
              return (
                <li key={t.id}>
                  <button type="button" onClick={() => navigate({ search: { task: t.id } })} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors", t.id === active.id ? "bg-accent" : "hover:bg-accent/40")}>
                    <PersonAvatar name={p ? fullName(p) : "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-medium">{p ? fullName(p) : "Unknown"}</p>
                        {t.priority === "high" && <Badge variant="signal">High</Badge>}
                      </div>
                      <p className="truncate text-[12px] text-subtle-foreground">{TASK_TYPE_LABEL[t.type]} · {p?.company}</p>
                    </div>
                    <span className={cn("num shrink-0 text-[11px]", overdue ? "font-medium text-destructive" : "text-subtle-foreground")}>{overdue ? "Overdue" : relativeAny(t.dueAt, now)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <section className="panel overflow-hidden">
            <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
              <PersonAvatar name={fullName(prospect)} size="lg" />
              <div className="min-w-0 flex-1">
                <Link to="/prospects" search={{ prospect: prospect.id }} className="font-semibold hover:text-primary">{fullName(prospect)}</Link>
                <p className="truncate text-[13px] text-muted-foreground">{prospect.title} · {prospect.company} · {prospect.location}</p>
              </div>
              <ScorePill score={prospect.score} />
            </header>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
                <span>Step: <span className="font-medium text-foreground">{TASK_TYPE_LABEL[active.type]}</span></span>
                <span>Campaign: <Link to="/campaigns/$campaignId" params={{ campaignId: active.campaignId }} className="font-medium text-primary hover:underline">{campaignName(active.campaignId)}</Link></span>
                {sender && (
                  <span className="flex items-center gap-1.5">Sends from <AccountAvatar name={sender.name} status={sender.status} size="sm" /> <span className="font-medium text-foreground">{sender.name}</span></span>
                )}
              </div>

              {prospect.icebreaker && <p className="rounded-md bg-accent px-3 py-2 text-[13px]"><span className="font-medium text-primary">Icebreaker:</span> {prospect.icebreaker}</p>}

              {active.postExcerpt && (
                <div className="rounded-md border border-border bg-elevated p-3 text-[13px]">
                  <p className="mb-1 text-[11px] text-subtle-foreground">Their latest post</p>
                  <p className="italic">“{active.postExcerpt}”</p>
                </div>
              )}

              {sender && sender.status === "disconnected" && (
                <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive"><AlertCircle className="size-4" />{sender.name} is disconnected — approving will queue this until the profile reconnects.</p>
              )}

              <div className="space-y-1.5">
                <p className="text-[12px] font-medium text-muted-foreground">AI draft {active.status === "pending_approval" ? "— edit before approving" : ""}</p>
                <Textarea rows={6} value={active.draft} disabled={active.status !== "pending_approval"} onChange={(e) => update(active.id, { draft: e.target.value })} className="text-[13px] leading-relaxed" aria-label="Draft message" />
                {active.type === "connection_request" && (
                  <p className={cn("num text-right text-[12px]", active.draft.length > INVITE_NOTE_LIMIT ? "text-destructive" : "text-subtle-foreground")}>{active.draft.length}/{INVITE_NOTE_LIMIT}</p>
                )}
              </div>

              {active.status === "pending_approval" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      const fn = ALTERNATIVES[regen % ALTERNATIVES.length];
                      if (fn) update(active.id, { draft: fn(prospect.firstName) });
                      setRegen((r) => r + 1);
                      toast("New draft generated");
                    }}
                  >
                    <RefreshCw /> Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      update(active.id, { status: "skipped" });
                      toast(`Skipped ${prospect.firstName}`);
                      advance();
                    }}
                  >
                    <SkipForward /> Skip
                  </Button>
                  <Button
                    size="sm"
                    className="ml-auto"
                    disabled={active.type === "connection_request" && active.draft.length > INVITE_NOTE_LIMIT}
                    onClick={() => {
                      update(active.id, { status: "completed" });
                      toast.success(`Approved & sent ${TASK_TYPE_LABEL[active.type].toLowerCase()} to ${prospect.firstName}`);
                      advance();
                    }}
                  >
                    <Send /> Approve & send
                  </Button>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Check className="size-4 text-success" /> {active.status === "completed" ? "Approved and sent." : "Skipped — this contact moves to the next step."}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

import { Clock, Eye, Heart, Mail, MessageCircle, MessageSquare, Mic, Send, ThumbsUp, UserPlus, Users } from "lucide-react";

import { HighlightedMessage } from "@/components/kit";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STEP_META, type SequenceStep, type StepType } from "@/lib/data/sequence-templates";
import { TEMPLATE_KIND_LABEL, TEMPLATES, templateById, type TemplateKind } from "@/lib/data/templates";
import { tokenize } from "@/lib/message-vars";
import { cn } from "@/lib/utils";

const STEP_ICON: Record<StepType, typeof Eye> = {
  visit_profile: Eye,
  follow: Users,
  endorse: ThumbsUp,
  like_post: Heart,
  comment_post: MessageCircle,
  send_invitation: UserPlus,
  send_message: MessageSquare,
  send_inmail: Mail,
  voice_note: Mic,
  wait: Clock,
};

const KINDS_FOR: Partial<Record<StepType, TemplateKind[]>> = {
  send_invitation: ["invite_note"],
  send_message: ["message", "follow_up"],
  send_inmail: ["inmail"],
  voice_note: ["voice_script"],
  comment_post: ["comment"],
};

export function SequenceEditor({ steps, tenantId, onChange }: { steps: SequenceStep[]; tenantId?: string; onChange?: (steps: SequenceStep[]) => void }) {
  const update = (id: string, patch: Partial<SequenceStep>) => onChange?.(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  let actionNo = 0;
  return (
    <ol className="relative space-y-2">
      {steps.map((step, i) => {
        const Icon = STEP_ICON[step.type];
        const meta = STEP_META[step.type];
        const kinds = KINDS_FOR[step.type];
        const template = step.templateId ? templateById(step.templateId) : undefined;
        const options = kinds ? TEMPLATES.filter((t) => kinds.includes(t.kind) && (!tenantId || t.tenantId === tenantId)) : [];
        if (step.type !== "wait") actionNo += 1;
        const isLast = i === steps.length - 1;

        if (step.type === "wait") {
          return (
            <li key={step.id} className="relative flex items-center gap-3 pl-[13px]">
              {!isLast && <span className="absolute top-0 bottom-[-8px] left-[17px] w-px bg-border" />}
              <span className="relative z-10 inline-flex size-2.5 rounded-full border-2 border-border-strong bg-card" />
              <div className="flex items-center gap-2 py-1 text-[13px] text-muted-foreground">
                <Clock className="size-3.5" />
                Wait
                {onChange ? (
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    aria-label="Wait days"
                    value={step.days ?? 0}
                    onChange={(e) => update(step.id, { days: Math.max(0, Number(e.target.value) || 0) })}
                    className="h-7 w-16 text-[13px]"
                  />
                ) : (
                  <span className="num font-medium text-foreground">{step.days ?? 0}</span>
                )}
                {(step.days ?? 0) === 1 ? "day" : "days"}
                {(step.days ?? 0) === 0 && <span className="text-[12px] text-subtle-foreground">· same day</span>}
              </div>
            </li>
          );
        }

        return (
          <li key={step.id} className="relative flex gap-3">
            {!isLast && <span className="absolute top-9 bottom-[-8px] left-[17px] w-px bg-border" />}
            <span className="relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-accent text-primary">
              <Icon className="size-4" />
            </span>
            <div className="panel min-w-0 flex-1 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-[11px] text-subtle-foreground">Step {actionNo}</span>
                <p className="text-[13px] font-semibold">{meta.label}</p>
                {step.type === "send_invitation" && <Badge variant="muted">{step.addNote ? "With note" : "No note"}</Badge>}
                {(meta.manual || step.requiresApproval) && <Badge variant="warning">SDR approves</Badge>}
                {onChange && kinds && (
                  <div className="ml-auto w-full sm:w-64">
                    <Select value={step.templateId ?? ""} onValueChange={(v) => update(step.id, { templateId: v })}>
                      <SelectTrigger className="h-8 text-[13px]" aria-label="Template">
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {template && (step.type !== "send_invitation" || step.addNote) && (
                <div className="mt-2.5 rounded-md border border-border bg-elevated p-3">
                  <p className="mb-1 text-[11px] text-subtle-foreground">
                    {TEMPLATE_KIND_LABEL[template.kind]} · {template.name}
                  </p>
                  {template.subject && <p className="mb-1 text-[12px] font-medium">Subject: {template.subject}</p>}
                  <HighlightedMessage parts={tokenize(template.body)} />
                </div>
              )}
              {!kinds && <p className={cn("mt-1 text-[12px] text-muted-foreground")}>Runs automatically from the sending profile.</p>}
            </div>
          </li>
        );
      })}
      <li className="flex items-center gap-3 pl-[13px] text-[12px] text-subtle-foreground">
        <Send className="size-3.5" /> Sequence ends — replies pause the contact automatically.
      </li>
    </ol>
  );
}

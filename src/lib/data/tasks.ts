import { PROSPECTS } from "./prospects";
import { hoursAgo, hoursAhead, pick, rng } from "./seed";

export type TaskType = "post_comment" | "free_inmail" | "connection_request" | "initial_message" | "voice_note" | "followup_message";
export type TaskStatus = "pending_approval" | "completed" | "skipped";

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  post_comment: "Post comment",
  free_inmail: "Free InMail",
  connection_request: "Connection request",
  initial_message: "Initial message",
  voice_note: "Voice note",
  followup_message: "Follow-up",
};

/** SDR Task Center tabs, in the order an SDR works through them. */
export const TASK_TABS: Array<{ id: string; label: string; types: TaskType[] }> = [
  { id: "post_comment", label: "Post comments", types: ["post_comment"] },
  { id: "free_inmail", label: "Free InMails", types: ["free_inmail"] },
  { id: "connection_request", label: "Connection requests", types: ["connection_request"] },
  { id: "initial_message", label: "Initial messages", types: ["initial_message", "voice_note"] },
  { id: "followup_message", label: "Follow-ups", types: ["followup_message"] },
];

export interface SdrTask {
  id: string;
  tenantId: string;
  prospectId: string;
  campaignId: string;
  accountId: string;
  type: TaskType;
  status: TaskStatus;
  priority: "high" | "normal";
  dueAt: string;
  draft: string;
  postExcerpt?: string;
}

const DRAFTS: Record<TaskType, (first: string, company: string) => string> = {
  post_comment: () => "Really sharp take — the point about cutting onboarding admin resonates. Curious how you measure time-to-productivity?",
  free_inmail: (f, c) => `Hi ${f}, saw your profile is open so reaching out directly. We help ${c} book qualified calls on LinkedIn without extra headcount. Worth 15 minutes?`,
  connection_request: (f) => `Hi ${f}, enjoyed your recent post — would be great to connect and swap notes.`,
  initial_message: (f, c) => `Thanks for connecting, ${f}! Quick one: how is ${c} handling outbound right now — in-house SDRs or agency?`,
  voice_note: (f, c) => `Hey ${f}, quick voice note — had an idea for ${c} I think you'll like. Mind if I share a 2-minute video?`,
  followup_message: (f) => `Hi ${f}, bumping this up in case it got buried — happy to send a short case study instead.`,
};

const POSTS = [
  "We just hit 100 employees. The hardest part wasn't hiring — it was onboarding consistently…",
  "Hot take: most finance teams don't need another tool, they need fewer handoffs.",
  "Three things I learned running an agency through a down market…",
];

function build(): SdrTask[] {
  const r = rng(77);
  const pool = PROSPECTS.filter((p) => p.campaignId && p.accountId && ["queued", "invited", "connected", "messaged"].includes(p.stage));
  const types: TaskType[] = ["post_comment", "free_inmail", "connection_request", "initial_message", "voice_note", "followup_message"];
  return pool.slice(0, 34).map((p, i) => {
    const type = pick(types, r);
    const status: TaskStatus = i % 7 === 5 ? "completed" : i % 11 === 9 ? "skipped" : "pending_approval";
    const due = r() < 0.3 ? hoursAgo(1 + r() * 30) : hoursAhead(r() * 30);
    return {
      id: `task-${i + 1}`,
      tenantId: p.tenantId,
      prospectId: p.id,
      campaignId: p.campaignId ?? "",
      accountId: p.accountId ?? "",
      type,
      status,
      priority: p.score >= 75 ? "high" : "normal",
      dueAt: due,
      draft: DRAFTS[type](p.firstName, p.company),
      ...(type === "post_comment" ? { postExcerpt: pick(POSTS, r) } : {}),
    };
  });
}

export const TASKS: SdrTask[] = build();

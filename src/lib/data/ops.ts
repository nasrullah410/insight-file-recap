import type { JobAction } from "../queue-rules";
import { PROSPECTS } from "./prospects";
import { hoursAgo, hoursAhead, pick, rng } from "./seed";

export type JobStatus = "scheduled" | "running" | "retrying" | "failed" | "done" | "cancelled";

export const JOB_ACTION_LABEL: Record<JobAction, string> = {
  visit_profile: "Visit profile",
  send_invitation: "Send invite",
  send_message: "Send message",
  send_inmail: "Send InMail",
  follow: "Follow",
  like_post: "Like post",
  voice_note: "Voice note",
  check_reply: "Check reply",
};

export interface QueueJob {
  id: string;
  tenantId: string;
  accountId: string;
  campaignId: string;
  prospectId: string;
  action: JobAction;
  status: JobStatus;
  scheduledAt: string;
  attempts: number;
  error?: string;
}

const ERRORS = [
  "Connect button not found. Header buttons: [More, Follow]",
  "Session expired — LinkedIn asked to sign in again",
  "Message box did not open within 15s",
  "Profile unavailable (404)",
];

function build(): QueueJob[] {
  const r = rng(404);
  const pool = PROSPECTS.filter((p) => p.campaignId && p.accountId);
  const actions: JobAction[] = ["send_invitation", "send_invitation", "send_message", "visit_profile", "send_inmail", "follow", "like_post", "voice_note", "check_reply"];
  const out: QueueJob[] = [];
  for (let i = 0; i < 46; i++) {
    const p = pick(pool, r);
    const action = pick(actions, r);
    const roll = r();
    const status: JobStatus = roll < 0.42 ? "scheduled" : roll < 0.48 ? "running" : roll < 0.56 ? "retrying" : roll < 0.66 ? "failed" : roll < 0.95 ? "done" : "cancelled";
    const past = status === "done" || status === "failed" || status === "cancelled";
    out.push({
      id: `job-${1000 + i}`,
      tenantId: p.tenantId,
      accountId: p.accountId ?? "",
      campaignId: p.campaignId ?? "",
      prospectId: p.id,
      action,
      status,
      scheduledAt: past ? hoursAgo(r() * 40) : hoursAhead(r() * 20),
      attempts: status === "retrying" ? 2 : status === "failed" ? 3 : status === "done" ? 1 : 0,
      ...(status === "failed" || status === "retrying" ? { error: pick(ERRORS, r) } : {}),
    });
  }
  return out;
}

export const JOBS: QueueJob[] = build();

import { ACCOUNTS, CAMPAIGNS } from "../demo-data";
import { fullName, PROSPECTS } from "./prospects";
import { hoursAgo, pick, rng } from "./seed";

export type LogKind = "invite_sent" | "invite_accepted" | "message_sent" | "inmail_sent" | "profile_viewed" | "voice_note_sent" | "comment_posted" | "reply_received" | "job_failed" | "account_disconnected" | "campaign_paused";

export const LOG_KIND_LABEL: Record<LogKind, string> = {
  invite_sent: "Invite sent",
  invite_accepted: "Invite accepted",
  message_sent: "Message sent",
  inmail_sent: "InMail sent",
  profile_viewed: "Profile viewed",
  voice_note_sent: "Voice note sent",
  comment_posted: "Comment posted",
  reply_received: "Reply received",
  job_failed: "Action failed",
  account_disconnected: "Profile disconnected",
  campaign_paused: "Campaign paused",
};

export interface LogEntry {
  id: string;
  tenantId: string;
  accountId: string;
  campaignId: string | null;
  prospectId: string | null;
  prospectName: string | null;
  kind: LogKind;
  triggeredBy: "Automation" | "SDR approval" | "System";
  status: "success" | "failed";
  at: string;
  detail: string;
}

function build(): LogEntry[] {
  const r = rng(9001);
  const pool = PROSPECTS.filter((p) => p.campaignId && p.accountId);
  const kinds: LogKind[] = ["invite_sent", "invite_sent", "invite_sent", "invite_accepted", "message_sent", "message_sent", "profile_viewed", "profile_viewed", "inmail_sent", "voice_note_sent", "comment_posted", "reply_received", "job_failed"];
  const out: LogEntry[] = [];
  for (let i = 0; i < 110; i++) {
    const p = pick(pool, r);
    const kind = pick(kinds, r);
    const manual = kind === "comment_posted" || kind === "voice_note_sent";
    out.push({
      id: `log-${i + 1}`,
      tenantId: p.tenantId,
      accountId: p.accountId ?? "",
      campaignId: p.campaignId,
      prospectId: p.id,
      prospectName: fullName(p),
      kind,
      triggeredBy: manual ? "SDR approval" : "Automation",
      status: kind === "job_failed" ? "failed" : "success",
      at: hoursAgo(i * 0.6 + r() * 0.5),
      detail:
        kind === "job_failed" ? "Connect button not found" : kind === "reply_received" ? "New reply in inbox" : kind === "invite_sent" ? (r() < 0.5 ? "With note" : "Without note") : "",
    });
  }
  const aisha = ACCOUNTS.find((a) => a.id === "acc-aisha");
  if (aisha) out.push({ id: "log-sys-1", tenantId: aisha.tenantId, accountId: aisha.id, campaignId: null, prospectId: null, prospectName: null, kind: "account_disconnected", triggeredBy: "System", status: "failed", at: hoursAgo(31), detail: "LinkedIn session expired" });
  const reeng = CAMPAIGNS.find((c) => c.id === "cmp-reengage");
  if (reeng) out.push({ id: "log-sys-2", tenantId: reeng.tenantId, accountId: "acc-james", campaignId: reeng.id, prospectId: null, prospectName: null, kind: "campaign_paused", triggeredBy: "System", status: "success", at: hoursAgo(52), detail: "All contacts finished" });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export const ACTIVITY_LOG: LogEntry[] = build();

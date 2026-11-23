import { isExhausted, isWithinWorkingHours, type LinkedInAccount } from "./account-health";

export type JobAction = "visit_profile" | "send_invitation" | "send_message" | "send_inmail" | "follow" | "like_post" | "voice_note" | "check_reply";

export type BlockReason = "account_disconnected" | "invite_limit" | "message_limit" | "inmail_credits" | "outside_hours";

export const BLOCK_REASON_LABEL: Record<BlockReason, string> = {
  account_disconnected: "Profile disconnected",
  invite_limit: "Invite limit reached",
  message_limit: "Daily message limit reached",
  inmail_credits: "No InMail credits left",
  outside_hours: "Outside working hours",
};

/**
 * Why a queued job can't run right now, or null when it can.
 * Order matters: a disconnected profile beats any limit.
 */
export function jobBlockReason(action: JobAction, account: LinkedInAccount, now: Date): BlockReason | null {
  if (account.connection !== "connected") return "account_disconnected";
  if (action === "send_invitation" && (isExhausted(account.weeklyInvites) || isExhausted(account.dailyInvites))) return "invite_limit";
  if ((action === "send_message" || action === "voice_note") && isExhausted(account.dailyMessages)) return "message_limit";
  if (action === "send_inmail" && isExhausted(account.inmailCredits)) return "inmail_credits";
  if (!isWithinWorkingHours(account, now)) return "outside_hours";
  return null;
}

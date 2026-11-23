/**
 * Pure rules that turn a LinkedIn account's limits, connection and recent
 * activity into issues and an overall health status. No React, no I/O.
 */

export interface Usage {
  used: number;
  limit: number;
}

export type ConnectionState = "connected" | "session_expired" | "restricted";

export interface WorkingHours {
  /** Local start hour, 0-23 */
  start: number;
  /** Local end hour (exclusive), 1-24 */
  end: number;
  /** ISO weekdays the account sends on, 1 = Monday … 7 = Sunday */
  days: number[];
}

export interface DayStat {
  date: string; // YYYY-MM-DD
  invites: number;
  accepted: number;
  messages: number;
  replies: number;
  views: number;
}

export interface LinkedInAccount {
  id: string;
  name: string;
  headline: string;
  tenantId: string;
  city: string;
  timezone: string;
  plan: "Premium" | "Sales Navigator" | "Free";
  workingHours: WorkingHours;
  connection: ConnectionState;
  weeklyInvites: Usage;
  dailyInvites: Usage;
  dailyMessages: Usage;
  inmailCredits: Usage;
  /** ISO timestamp when the rolling weekly invite window resets */
  weeklyResetAt: string;
  pendingInvites: number;
  lastSyncAt: string;
  history: DayStat[];
}

export type IssueSeverity = "critical" | "warning" | "info";

export type IssueCode =
  | "session_expired"
  | "restricted"
  | "weekly_invite_limit"
  | "daily_invite_limit"
  | "daily_message_limit"
  | "inmail_exhausted"
  | "weekly_invite_near_limit"
  | "low_acceptance"
  | "pending_invites_high";

export interface AccountIssue {
  code: IssueCode;
  severity: IssueSeverity;
  title: string;
  detail: string;
  action: string;
  /** True when the issue stops the account from sending connection requests or messages */
  blocking: boolean;
}

export type HealthStatus = "healthy" | "at_risk" | "limited" | "disconnected";

export const NEAR_LIMIT_RATIO = 0.85;
export const LOW_ACCEPTANCE_RATE = 0.2;
export const LOW_ACCEPTANCE_MIN_INVITES = 30;
export const PENDING_INVITES_WARNING = 500;

const SEVERITY_ORDER: Record<IssueSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function isExhausted(u: Usage): boolean {
  return u.limit > 0 && u.used >= u.limit;
}

export function usageRatio(u: Usage): number {
  if (u.limit <= 0) return 0;
  return Math.min(1, u.used / u.limit);
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return "now";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function sumHistory(history: DayStat[], days: number, offset = 0) {
  const end = history.length - offset;
  const slice = history.slice(Math.max(0, end - days), Math.max(0, end));
  return slice.reduce(
    (acc, d) => ({
      invites: acc.invites + d.invites,
      accepted: acc.accepted + d.accepted,
      messages: acc.messages + d.messages,
      replies: acc.replies + d.replies,
      views: acc.views + d.views,
    }),
    { invites: 0, accepted: 0, messages: 0, replies: 0, views: 0 },
  );
}

export interface LocalClock {
  hour: number;
  minute: number;
  /** 1 = Monday … 7 = Sunday */
  weekday: number;
  label: string;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function getLocalClock(timezone: string, now: Date): LocalClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  const weekday = WEEKDAYS[get("weekday")] ?? 1;
  const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { hour, minute, weekday, label };
}

export function isWithinWorkingHours(account: Pick<LinkedInAccount, "timezone" | "workingHours">, now: Date): boolean {
  const clock = getLocalClock(account.timezone, now);
  const { start, end, days } = account.workingHours;
  return days.includes(clock.weekday) && clock.hour >= start && clock.hour < end;
}

export function getAccountIssues(account: LinkedInAccount, now: Date): AccountIssue[] {
  const issues: AccountIssue[] = [];

  if (account.connection === "session_expired") {
    issues.push({
      code: "session_expired",
      severity: "critical",
      title: "LinkedIn session expired",
      detail: "All campaign steps for this profile are on hold until it is reconnected.",
      action: "Reconnect account",
      blocking: true,
    });
  }
  if (account.connection === "restricted") {
    issues.push({
      code: "restricted",
      severity: "critical",
      title: "Restricted by LinkedIn",
      detail: "LinkedIn has temporarily restricted this profile. Sending is paused to protect it.",
      action: "Verify identity on LinkedIn",
      blocking: true,
    });
  }

  if (isExhausted(account.weeklyInvites)) {
    const resetIn = formatDuration(new Date(account.weeklyResetAt).getTime() - now.getTime());
    issues.push({
      code: "weekly_invite_limit",
      severity: "critical",
      title: "Weekly invite limit reached",
      detail: `${account.weeklyInvites.used}/${account.weeklyInvites.limit} connection requests used. Resets in ${resetIn}.`,
      action: "Invites resume automatically — messages keep sending",
      blocking: true,
    });
  } else if (usageRatio(account.weeklyInvites) >= NEAR_LIMIT_RATIO) {
    issues.push({
      code: "weekly_invite_near_limit",
      severity: "info",
      title: "Close to weekly invite limit",
      detail: `${account.weeklyInvites.used}/${account.weeklyInvites.limit} used this week.`,
      action: "Consider shifting volume to another profile",
      blocking: false,
    });
  }

  if (isExhausted(account.dailyInvites) && !isExhausted(account.weeklyInvites)) {
    issues.push({
      code: "daily_invite_limit",
      severity: "warning",
      title: "Daily invite limit reached",
      detail: `${account.dailyInvites.used}/${account.dailyInvites.limit} sent today. Resets at midnight local time.`,
      action: "Resumes tomorrow",
      blocking: true,
    });
  }

  if (isExhausted(account.dailyMessages)) {
    issues.push({
      code: "daily_message_limit",
      severity: "warning",
      title: "Daily message limit reached",
      detail: `${account.dailyMessages.used}/${account.dailyMessages.limit} messages sent today.`,
      action: "Resumes tomorrow",
      blocking: true,
    });
  }

  if (isExhausted(account.inmailCredits)) {
    issues.push({
      code: "inmail_exhausted",
      severity: "warning",
      title: "No InMail credits left",
      detail: `All ${account.inmailCredits.limit} monthly InMail credits are used. InMail steps are skipped.`,
      action: "Top up credits or remove InMail steps",
      blocking: false,
    });
  }

  const week = sumHistory(account.history, 7);
  if (week.invites >= LOW_ACCEPTANCE_MIN_INVITES && week.accepted / week.invites < LOW_ACCEPTANCE_RATE) {
    issues.push({
      code: "low_acceptance",
      severity: "warning",
      title: "Low acceptance rate",
      detail: `Only ${Math.round((week.accepted / week.invites) * 100)}% of invites accepted in the last 7 days. LinkedIn may flag the profile.`,
      action: "Tighten targeting or personalise the note",
      blocking: false,
    });
  }

  if (account.pendingInvites >= PENDING_INVITES_WARNING) {
    issues.push({
      code: "pending_invites_high",
      severity: "warning",
      title: "Too many pending invites",
      detail: `${account.pendingInvites} invites are still pending. Keep this under ${PENDING_INVITES_WARNING}.`,
      action: "Withdraw invites older than 3 weeks",
      blocking: false,
    });
  }

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function getAccountStatus(account: LinkedInAccount, now: Date): HealthStatus {
  if (account.connection !== "connected") return "disconnected";
  const issues = getAccountIssues(account, now);
  if (issues.some((i) => i.blocking)) return "limited";
  if (issues.some((i) => i.severity === "warning")) return "at_risk";
  return "healthy";
}

export type CampaignStatus = "active" | "paused" | "draft";
export type CampaignHealth = "running" | "degraded" | "blocked" | "paused";

/**
 * A campaign is blocked when none of its sending profiles can send,
 * degraded when some can't, running when all can.
 */
export function getCampaignHealth(
  campaign: { status: CampaignStatus; accountIds: string[] },
  accounts: LinkedInAccount[],
  now: Date,
): CampaignHealth {
  if (campaign.status !== "active") return "paused";
  const senders = accounts.filter((a) => campaign.accountIds.includes(a.id));
  if (senders.length === 0) return "blocked";
  const unable = senders.filter((a) => {
    const s = getAccountStatus(a, now);
    return s === "limited" || s === "disconnected";
  }).length;
  if (unable === senders.length) return "blocked";
  if (unable > 0) return "degraded";
  return "running";
}

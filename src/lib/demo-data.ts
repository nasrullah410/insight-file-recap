/**
 * Sample workspace data used until the dashboard is wired to the real backend.
 * Everything is deterministic so server and browser render identically.
 */
import type { CampaignStatus, DayStat, LinkedInAccount } from "./account-health";

/** Fixed "now" for the sample data snapshot. */
export const NOW = new Date("2026-11-23T19:30:00Z");

export interface Tenant {
  id: string;
  name: string;
  short: string;
  plan: string;
}

export const TENANTS: Tenant[] = [
  { id: "hq", name: "Convrtln HQ", short: "HQ", plan: "Internal" },
  { id: "northwind", name: "Northwind Growth", short: "NW", plan: "Agency client" },
  { id: "brightlane", name: "Brightlane SaaS", short: "BL", plan: "Agency client" },
];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function isoDay(offsetDays: number): string {
  const d = new Date(NOW.getTime() - offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

interface HistoryProfile {
  seed: number;
  invites: number;
  accept: number; // 0..1
  msgs: number;
  reply: number; // replies per message
  /** Number of most recent days with no activity (e.g. disconnected) */
  silentDays?: number;
  /** Days ago from which invites stopped (weekly limit) */
  invitesStoppedDays?: number;
}

function buildHistory(p: HistoryProfile, days = 28): DayStat[] {
  const r = rng(p.seed);
  const out: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = isoDay(i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const factor = weekend ? 0.25 : 0.75 + r() * 0.5;
    const silent = p.silentDays !== undefined && i < p.silentDays;
    const invitesStopped = p.invitesStoppedDays !== undefined && i < p.invitesStoppedDays;
    const invites = silent || invitesStopped ? 0 : Math.round(p.invites * factor);
    const accepted = silent ? 0 : Math.round(p.invites * factor * p.accept * (0.8 + r() * 0.4));
    const messages = silent ? 0 : Math.round(p.msgs * factor);
    const replies = silent ? 0 : Math.round(messages * p.reply * (0.5 + r()));
    const views = silent ? 0 : Math.round((invites + messages) * 0.08 * (0.5 + r()));
    out.push({ date, invites, accepted, messages, replies, views });
  }
  return out;
}

const weekdays = [1, 2, 3, 4, 5];
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const hoursAhead = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

export const ACCOUNTS: LinkedInAccount[] = [
  {
    id: "acc-sarah",
    name: "Sarah Khan",
    headline: "Head of Partnerships · Convrtln",
    tenantId: "hq",
    city: "Karachi",
    timezone: "Asia/Karachi",
    plan: "Sales Navigator",
    workingHours: { start: 9, end: 18, days: weekdays },
    connection: "connected",
    weeklyInvites: { used: 64, limit: 100 },
    dailyInvites: { used: 12, limit: 20 },
    dailyMessages: { used: 31, limit: 80 },
    inmailCredits: { used: 18, limit: 50 },
    weeklyResetAt: hoursAhead(70),
    pendingInvites: 212,
    lastSyncAt: hoursAgo(0.04),
    history: buildHistory({ seed: 11, invites: 16, accept: 0.34, msgs: 22, reply: 0.06 }),
  },
  {
    id: "acc-daniel",
    name: "Daniel Reyes",
    headline: "Founder · Convrtln",
    tenantId: "hq",
    city: "Dubai",
    timezone: "Asia/Dubai",
    plan: "Premium",
    workingHours: { start: 8, end: 20, days: [1, 2, 3, 4, 5, 6] },
    connection: "connected",
    weeklyInvites: { used: 100, limit: 100 },
    dailyInvites: { used: 0, limit: 20 },
    dailyMessages: { used: 46, limit: 80 },
    inmailCredits: { used: 9, limit: 15 },
    weeklyResetAt: hoursAhead(52),
    pendingInvites: 341,
    lastSyncAt: hoursAgo(0.08),
    history: buildHistory({ seed: 23, invites: 22, accept: 0.29, msgs: 30, reply: 0.05, invitesStoppedDays: 2 }),
  },
  {
    id: "acc-aisha",
    name: "Aisha Malik",
    headline: "SDR Lead · Convrtln",
    tenantId: "hq",
    city: "Lahore",
    timezone: "Asia/Karachi",
    plan: "Sales Navigator",
    workingHours: { start: 10, end: 19, days: weekdays },
    connection: "session_expired",
    weeklyInvites: { used: 38, limit: 100 },
    dailyInvites: { used: 0, limit: 20 },
    dailyMessages: { used: 0, limit: 80 },
    inmailCredits: { used: 12, limit: 50 },
    weeklyResetAt: hoursAhead(96),
    pendingInvites: 158,
    lastSyncAt: hoursAgo(31),
    history: buildHistory({ seed: 37, invites: 14, accept: 0.31, msgs: 18, reply: 0.07, silentDays: 2 }),
  },
  {
    id: "acc-omar",
    name: "Omar Siddiqui",
    headline: "Growth Advisor · Northwind",
    tenantId: "northwind",
    city: "London",
    timezone: "Europe/London",
    plan: "Sales Navigator",
    workingHours: { start: 8, end: 18, days: weekdays },
    connection: "connected",
    weeklyInvites: { used: 81, limit: 150 },
    dailyInvites: { used: 25, limit: 25 },
    dailyMessages: { used: 52, limit: 100 },
    inmailCredits: { used: 22, limit: 50 },
    weeklyResetAt: hoursAhead(110),
    pendingInvites: 289,
    lastSyncAt: hoursAgo(0.05),
    history: buildHistory({ seed: 41, invites: 21, accept: 0.36, msgs: 34, reply: 0.07 }),
  },
  {
    id: "acc-emma",
    name: "Emma Lawson",
    headline: "Account Executive · Northwind",
    tenantId: "northwind",
    city: "New York",
    timezone: "America/New_York",
    plan: "Premium",
    workingHours: { start: 9, end: 17, days: weekdays },
    connection: "connected",
    weeklyInvites: { used: 88, limit: 100 },
    dailyInvites: { used: 9, limit: 20 },
    dailyMessages: { used: 18, limit: 80 },
    inmailCredits: { used: 4, limit: 15 },
    weeklyResetAt: hoursAhead(30),
    pendingInvites: 612,
    lastSyncAt: hoursAgo(0.1),
    history: buildHistory({ seed: 53, invites: 18, accept: 0.13, msgs: 14, reply: 0.07 }),
  },
  {
    id: "acc-james",
    name: "James Carter",
    headline: "VP Sales · Northwind",
    tenantId: "northwind",
    city: "Austin",
    timezone: "America/Chicago",
    plan: "Sales Navigator",
    workingHours: { start: 8, end: 17, days: weekdays },
    connection: "connected",
    weeklyInvites: { used: 47, limit: 120 },
    dailyInvites: { used: 11, limit: 25 },
    dailyMessages: { used: 27, limit: 100 },
    inmailCredits: { used: 15, limit: 50 },
    weeklyResetAt: hoursAhead(130),
    pendingInvites: 174,
    lastSyncAt: hoursAgo(0.06),
    history: buildHistory({ seed: 67, invites: 15, accept: 0.41, msgs: 20, reply: 0.09 }),
  },
  {
    id: "acc-lina",
    name: "Lina Haddad",
    headline: "Customer Success · Brightlane",
    tenantId: "brightlane",
    city: "Berlin",
    timezone: "Europe/Berlin",
    plan: "Sales Navigator",
    workingHours: { start: 9, end: 18, days: weekdays },
    connection: "connected",
    weeklyInvites: { used: 55, limit: 100 },
    dailyInvites: { used: 6, limit: 20 },
    dailyMessages: { used: 29, limit: 80 },
    inmailCredits: { used: 50, limit: 50 },
    weeklyResetAt: hoursAhead(84),
    pendingInvites: 233,
    lastSyncAt: hoursAgo(0.07),
    history: buildHistory({ seed: 71, invites: 13, accept: 0.33, msgs: 19, reply: 0.08 }),
  },
  {
    id: "acc-marco",
    name: "Marco Rossi",
    headline: "Partner · Brightlane",
    tenantId: "brightlane",
    city: "Milan",
    timezone: "Europe/Rome",
    plan: "Premium",
    workingHours: { start: 9, end: 19, days: weekdays },
    connection: "connected",
    weeklyInvites: { used: 41, limit: 100 },
    dailyInvites: { used: 8, limit: 20 },
    dailyMessages: { used: 22, limit: 80 },
    inmailCredits: { used: 3, limit: 15 },
    weeklyResetAt: hoursAhead(100),
    pendingInvites: 120,
    lastSyncAt: hoursAgo(0.03),
    history: buildHistory({ seed: 83, invites: 12, accept: 0.38, msgs: 16, reply: 0.1 }),
  },
];

export interface Campaign {
  id: string;
  name: string;
  tenantId: string;
  status: CampaignStatus;
  accountIds: string[];
  steps: string[];
  contacts: number;
  completed: number;
  invites: number;
  accepted: number;
  messages: number;
  replies: number;
  startedAt: string;
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "cmp-founders",
    name: "2nd-degree Founders — EU",
    tenantId: "hq",
    status: "active",
    accountIds: ["acc-sarah", "acc-daniel"],
    steps: ["View", "Invite", "Message", "Follow-up", "Like post", "Follow-up"],
    contacts: 420,
    completed: 168,
    invites: 312,
    accepted: 101,
    messages: 96,
    replies: 9,
    startedAt: "2026-11-02",
  },
  {
    id: "cmp-multitouch",
    name: "Convrtln AI Multi-Touch (InMail + Comment + Voice)",
    tenantId: "hq",
    status: "active",
    accountIds: ["acc-daniel", "acc-aisha"],
    steps: ["View", "Comment", "InMail", "Invite", "Voice note", "Message", "Follow-up"],
    contacts: 360,
    completed: 61,
    invites: 206,
    accepted: 60,
    messages: 50,
    replies: 4,
    startedAt: "2026-11-10",
  },
  {
    id: "cmp-cfo",
    name: "Series A CFOs — US",
    tenantId: "northwind",
    status: "active",
    accountIds: ["acc-emma", "acc-james"],
    steps: ["View", "Invite", "Message", "Follow-up", "Follow-up"],
    contacts: 540,
    completed: 297,
    invites: 401,
    accepted: 98,
    messages: 112,
    replies: 13,
    startedAt: "2026-10-27",
  },
  {
    id: "cmp-agency",
    name: "Agency Owners — UK",
    tenantId: "northwind",
    status: "active",
    accountIds: ["acc-omar"],
    steps: ["Invite", "Message", "Voice note", "Follow-up"],
    contacts: 280,
    completed: 119,
    invites: 214,
    accepted: 82,
    messages: 77,
    replies: 11,
    startedAt: "2026-11-05",
  },
  {
    id: "cmp-reengage",
    name: "Q3 Webinar re-engage",
    tenantId: "northwind",
    status: "paused",
    accountIds: ["acc-james"],
    steps: ["Message", "Follow-up"],
    contacts: 150,
    completed: 150,
    invites: 0,
    accepted: 0,
    messages: 150,
    replies: 17,
    startedAt: "2026-09-14",
  },
  {
    id: "cmp-hrtech",
    name: "HR Tech Buyers — DACH",
    tenantId: "brightlane",
    status: "active",
    accountIds: ["acc-lina", "acc-marco"],
    steps: ["View", "InMail", "Invite", "Message", "Follow-up"],
    contacts: 310,
    completed: 102,
    invites: 188,
    accepted: 66,
    messages: 70,
    replies: 10,
    startedAt: "2026-11-08",
  },
];

export interface ReplyItem {
  id: string;
  tenantId: string;
  accountId: string;
  campaignId: string;
  prospect: string;
  title: string;
  snippet: string;
  sentiment: "interested" | "neutral" | "not_now";
  at: string;
}

export const REPLIES: ReplyItem[] = [
  { id: "r1", tenantId: "northwind", accountId: "acc-omar", campaignId: "cmp-agency", prospect: "Tara Nixon", title: "Business Development Director", snippet: "Sounds relevant — can you send over a few times next week?", sentiment: "interested", at: hoursAgo(0.4) },
  { id: "r2", tenantId: "hq", accountId: "acc-sarah", campaignId: "cmp-founders", prospect: "Antonio Velkovski", title: "Founder & CEO", snippet: "Thanks for reaching out. What does onboarding look like?", sentiment: "interested", at: hoursAgo(1.2) },
  { id: "r3", tenantId: "brightlane", accountId: "acc-marco", campaignId: "cmp-hrtech", prospect: "Ingmar Mier", title: "Managing Director", snippet: "We just signed with another vendor, maybe Q2.", sentiment: "not_now", at: hoursAgo(2.6) },
  { id: "r4", tenantId: "hq", accountId: "acc-daniel", campaignId: "cmp-multitouch", prospect: "Dave Miller", title: "Co-founder / Chief Success Wizard", snippet: "Loved the voice note 😄 Let's chat.", sentiment: "interested", at: hoursAgo(3.1) },
  { id: "r5", tenantId: "northwind", accountId: "acc-james", campaignId: "cmp-cfo", prospect: "Peter Buijs", title: "CFO", snippet: "Who else in fintech are you working with?", sentiment: "neutral", at: hoursAgo(5.5) },
  { id: "r6", tenantId: "brightlane", accountId: "acc-lina", campaignId: "cmp-hrtech", prospect: "Klara Hoffmann", title: "Head of People", snippet: "Please share a case study.", sentiment: "neutral", at: hoursAgo(7.8) },
];

export interface ActivityItem {
  id: string;
  tenantId: string;
  accountId: string;
  campaignId: string;
  prospect: string;
  kind: "invite" | "accepted" | "message" | "inmail" | "view" | "voice";
  at: string;
}

export const ACTIVITY: ActivityItem[] = [
  { id: "e1", tenantId: "hq", accountId: "acc-sarah", campaignId: "cmp-founders", prospect: "Sunil Chandarana", kind: "message", at: hoursAgo(0.1) },
  { id: "e2", tenantId: "northwind", accountId: "acc-omar", campaignId: "cmp-agency", prospect: "Jahid Sajon", kind: "accepted", at: hoursAgo(0.25) },
  { id: "e3", tenantId: "hq", accountId: "acc-daniel", campaignId: "cmp-multitouch", prospect: "Rafay A.", kind: "voice", at: hoursAgo(0.5) },
  { id: "e4", tenantId: "brightlane", accountId: "acc-marco", campaignId: "cmp-hrtech", prospect: "Kamsa Johnson-Thephavong", kind: "invite", at: hoursAgo(0.7) },
  { id: "e5", tenantId: "northwind", accountId: "acc-james", campaignId: "cmp-cfo", prospect: "Alex Stein", kind: "message", at: hoursAgo(1.1) },
  { id: "e6", tenantId: "brightlane", accountId: "acc-lina", campaignId: "cmp-hrtech", prospect: "Nora Weiss", kind: "view", at: hoursAgo(1.4) },
  { id: "e7", tenantId: "northwind", accountId: "acc-emma", campaignId: "cmp-cfo", prospect: "Chris Doyle", kind: "invite", at: hoursAgo(2.0) },
];

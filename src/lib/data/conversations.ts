import { REPLIES, type ReplyItem } from "../demo-data";
import { hoursAgo } from "./seed";

export type Sentiment = "interested" | "neutral" | "not_now" | "not_interested";
export type InboxChannel = "linkedin" | "inmail" | "sales_nav";

export const SENTIMENT_META: Record<Sentiment, { label: string; variant: "success" | "info" | "warning" | "muted" }> = {
  interested: { label: "Interested", variant: "success" },
  neutral: { label: "Question", variant: "info" },
  not_now: { label: "Not now", variant: "warning" },
  not_interested: { label: "Not interested", variant: "muted" },
};

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  accountId: string;
  campaignId: string | null;
  prospectId: string;
  channel: InboxChannel;
  sentiment: Sentiment;
  unread: boolean;
  archived: boolean;
  messages: ChatMessage[];
}

const PROSPECT_FOR: Record<string, string> = { r1: "p-tara", r2: "p-antonio", r3: "p-ingmar", r4: "p-dave", r5: "p-peter", r6: "p-klara" };
const OPENERS: Record<string, string> = {
  r1: "Hi Tara, we white-label LinkedIn outreach for agencies in London — could add a new retainer line for Brandforge.",
  r2: "Thanks for connecting, Antonio! We help teams like Stackhaus book 15–20 qualified calls a month on LinkedIn. Open to a quick look?",
  r3: "Hallo Ingmar, we help HR teams in DACH cut onboarding admin by 40%. Open to a short demo?",
  r4: "Hey Dave — sent you a quick voice note with an idea for Orbitly 🎙️",
  r5: "Appreciate the connect, Peter. Teams like Payzen usually lose ~6 days a month to manual reconciliation. Worth comparing notes?",
  r6: "Thanks for connecting, Klara! How is Kindred HR handling onboarding for new hires right now?",
};

function fromReply(r: ReplyItem, i: number): Conversation {
  const replyAt = new Date(r.at).getTime();
  return {
    id: `conv-${r.id}`,
    tenantId: r.tenantId,
    accountId: r.accountId,
    campaignId: r.campaignId,
    prospectId: PROSPECT_FOR[r.id] ?? "",
    channel: r.id === "r3" || r.id === "r6" ? "inmail" : "linkedin",
    sentiment: r.sentiment,
    unread: i < 3,
    archived: false,
    messages: [
      { id: `${r.id}-a`, from: "me", text: OPENERS[r.id] ?? "", at: new Date(replyAt - 26 * 3_600_000).toISOString() },
      { id: `${r.id}-b`, from: "them", text: r.snippet, at: r.at },
    ],
  };
}

export const CONVERSATIONS: Conversation[] = [
  ...REPLIES.map(fromReply),
  {
    id: "conv-sunil", tenantId: "hq", accountId: "acc-sarah", campaignId: "cmp-founders", prospectId: "p-sunil", channel: "linkedin", sentiment: "neutral", unread: false, archived: false,
    messages: [
      { id: "s1", from: "me", text: "Thanks for connecting, Sunil! Saw Cloudmint just opened a second office — congrats.", at: hoursAgo(30) },
      { id: "s2", from: "them", text: "Thanks! What exactly do you do?", at: hoursAgo(12) },
      { id: "s3", from: "me", text: "We run LinkedIn outreach for founders — think a full SDR team without the hiring. Happy to show you a live campaign.", at: hoursAgo(11) },
    ],
  },
  {
    id: "conv-alex", tenantId: "northwind", accountId: "acc-james", campaignId: "cmp-cfo", prospectId: "p-alex", channel: "sales_nav", sentiment: "not_interested", unread: false, archived: true,
    messages: [
      { id: "x1", from: "me", text: "Hi Alex — teams like Fintrail usually lose ~6 days a month to manual reconciliation.", at: hoursAgo(80) },
      { id: "x2", from: "them", text: "Not a priority for us, thanks.", at: hoursAgo(60) },
    ],
  },
  {
    id: "conv-jahid", tenantId: "northwind", accountId: "acc-omar", campaignId: "cmp-agency", prospectId: "p-jahid", channel: "linkedin", sentiment: "interested", unread: true, archived: false,
    messages: [
      { id: "j1", from: "me", text: "Thanks for accepting, Jahid! Quick voice note on the way.", at: hoursAgo(8) },
      { id: "j2", from: "them", text: "Got it — send me pricing for 3 seats?", at: hoursAgo(0.2) },
    ],
  },
];

export function lastMessage(c: Conversation) {
  return c.messages[c.messages.length - 1];
}

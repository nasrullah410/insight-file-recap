import { hoursAgo } from "./seed";

export type TemplateKind = "invite_note" | "message" | "inmail" | "follow_up" | "voice_script" | "comment";

export const TEMPLATE_KIND_LABEL: Record<TemplateKind, string> = {
  invite_note: "Invite note",
  message: "Message",
  inmail: "InMail",
  follow_up: "Follow-up",
  voice_script: "Voice note script",
  comment: "Post comment",
};

export interface MessageTemplate {
  id: string;
  tenantId: string;
  name: string;
  kind: TemplateKind;
  subject?: string;
  body: string;
  tags: string[];
  uses: number;
  replyRate: number; // 0..1
  updatedAt: string;
}

export const TEMPLATES: MessageTemplate[] = [
  { id: "t-invite-founder", tenantId: "hq", name: "Founder invite — shared space", kind: "invite_note", body: "Hi {{first_name}}, I work with founders building in {{industry}} and enjoy swapping notes. Would be great to connect.", tags: ["founders"], uses: 312, replyRate: 0.0, updatedAt: hoursAgo(50) },
  { id: "t-msg-founder", tenantId: "hq", name: "Founder intro — pipeline", kind: "message", body: "Thanks for connecting, {{first_name}}! {{icebreaker}}\n\nWe help teams like {{company}} book 15–20 qualified calls a month on LinkedIn without adding SDR headcount. Open to a quick look?", tags: ["founders", "intro"], uses: 96, replyRate: 0.094, updatedAt: hoursAgo(26) },
  { id: "t-fu-1", tenantId: "hq", name: "Soft follow-up #1", kind: "follow_up", body: "Hi {{first_name}}, just floating this back up — happy to share how another {{industry}} team did it in 30 days.", tags: ["follow-up"], uses: 74, replyRate: 0.061, updatedAt: hoursAgo(80) },
  { id: "t-voice", tenantId: "hq", name: "Voice note — 25 sec", kind: "voice_script", body: "Hey {{first_name}}, {{sender_name}} here. {{icebreaker}} Quick idea for {{company}} — mind if I send a 2-minute video?", tags: ["voice"], uses: 41, replyRate: 0.17, updatedAt: hoursAgo(10) },
  { id: "t-comment", tenantId: "hq", name: "Thoughtful post comment", kind: "comment", body: "Great point on {{icebreaker}} — we've seen the same with teams scaling past 50 people.", tags: ["warm-up"], uses: 58, replyRate: 0.0, updatedAt: hoursAgo(130) },
  { id: "t-inmail-open", tenantId: "hq", name: "Open-profile InMail", kind: "inmail", subject: "Idea for {{company}}", body: "Hi {{first_name}}, noticed your profile is open so reaching out directly. {{icebreaker}} Worth a 15-minute chat this week?", tags: ["inmail"], uses: 39, replyRate: 0.11, updatedAt: hoursAgo(64) },
  { id: "t-cfo-invite", tenantId: "northwind", name: "CFO invite — finance ops", kind: "invite_note", body: "Hi {{first_name}} — I speak with finance leaders at Series A companies about closing the books faster. Would love to connect.", tags: ["cfo"], uses: 401, replyRate: 0.0, updatedAt: hoursAgo(200) },
  { id: "t-cfo-msg", tenantId: "northwind", name: "CFO value message", kind: "message", body: "Appreciate the connect, {{first_name}}. Teams like {{company}} usually lose ~6 days a month to manual reconciliation. We cut that to 1. Worth comparing notes?", tags: ["cfo"], uses: 112, replyRate: 0.116, updatedAt: hoursAgo(90) },
  { id: "t-agency-msg", tenantId: "northwind", name: "Agency owner intro", kind: "message", body: "Hi {{first_name}}, {{icebreaker}} We white-label LinkedIn outreach for agencies in {{location}} — could add a new retainer line for {{company}}.", tags: ["agency"], uses: 77, replyRate: 0.143, updatedAt: hoursAgo(33) },
  { id: "t-agency-fu", tenantId: "northwind", name: "Agency follow-up — case study", kind: "follow_up", body: "{{first_name}}, here's the 1-page case study I mentioned. Happy to walk through it.", tags: ["agency", "follow-up"], uses: 51, replyRate: 0.09, updatedAt: hoursAgo(140) },
  { id: "t-hr-inmail", tenantId: "brightlane", name: "HR buyer InMail", kind: "inmail", subject: "Onboarding at {{company}}", body: "Hallo {{first_name}}, {{icebreaker}} We help HR teams in DACH cut onboarding admin by 40%. Open to a short demo?", tags: ["hr"], uses: 66, replyRate: 0.15, updatedAt: hoursAgo(46) },
  { id: "t-hr-msg", tenantId: "brightlane", name: "HR value message", kind: "message", body: "Thanks for connecting, {{first_name}}! How is {{company}} handling onboarding for new hires right now?", tags: ["hr"], uses: 70, replyRate: 0.143, updatedAt: hoursAgo(20) },
];

export function templateById(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}

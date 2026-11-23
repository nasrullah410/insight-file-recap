export type StepType = "visit_profile" | "follow" | "endorse" | "like_post" | "comment_post" | "send_invitation" | "send_message" | "send_inmail" | "voice_note" | "wait";

export const STEP_META: Record<StepType, { label: string; manual: boolean }> = {
  visit_profile: { label: "Visit profile", manual: false },
  follow: { label: "Follow", manual: false },
  endorse: { label: "Endorse skill", manual: false },
  like_post: { label: "Like recent post", manual: false },
  comment_post: { label: "Comment on post", manual: true },
  send_invitation: { label: "Connection request", manual: false },
  send_message: { label: "Message", manual: false },
  send_inmail: { label: "Free InMail", manual: false },
  voice_note: { label: "Voice note", manual: true },
  wait: { label: "Wait", manual: false },
};

export interface SequenceStep {
  id: string;
  type: StepType;
  /** Wait days for `wait` steps. 0 is valid and means "same day". */
  days?: number;
  templateId?: string;
  addNote?: boolean;
  requiresApproval?: boolean;
}

export interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
}

const s = (id: string, type: StepType, extra: Partial<SequenceStep> = {}): SequenceStep => ({ id, type, ...extra });

export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  {
    id: "seq-warmup-open",
    name: "Multi-day warm-up & open-profile flow",
    description: "Day 1 view → Day 2 like, comment & follow → Day 3 free InMail or invite.",
    steps: [s("1", "visit_profile"), s("2", "wait", { days: 1 }), s("3", "like_post"), s("4", "comment_post", { templateId: "t-comment", requiresApproval: true }), s("5", "follow"), s("6", "wait", { days: 1 }), s("7", "send_inmail", { templateId: "t-inmail-open" }), s("8", "send_invitation", { addNote: true, templateId: "t-invite-founder" })],
  },
  {
    id: "seq-voice",
    name: "Voice note outreach",
    description: "Highest reply rate — invite, then a short personal voice note.",
    steps: [s("1", "visit_profile"), s("2", "send_invitation", { addNote: false }), s("3", "wait", { days: 0 }), s("4", "voice_note", { templateId: "t-voice", requiresApproval: true }), s("5", "wait", { days: 3 }), s("6", "send_message", { templateId: "t-fu-1" })],
  },
  {
    id: "seq-connect-2fu",
    name: "Connect + 2 follow-ups",
    description: "Classic invite, intro message and two polite follow-ups.",
    steps: [s("1", "send_invitation", { addNote: true, templateId: "t-invite-founder" }), s("2", "wait", { days: 1 }), s("3", "send_message", { templateId: "t-msg-founder" }), s("4", "wait", { days: 3 }), s("5", "send_message", { templateId: "t-fu-1" }), s("6", "wait", { days: 5 }), s("7", "send_message", { templateId: "t-fu-1" })],
  },
  {
    id: "seq-warm-connect",
    name: "Warm-up, then connect",
    description: "Visit, follow and endorse before sending an invite.",
    steps: [s("1", "visit_profile"), s("2", "follow"), s("3", "endorse"), s("4", "wait", { days: 2 }), s("5", "send_invitation", { addNote: true, templateId: "t-invite-founder" }), s("6", "wait", { days: 1 }), s("7", "send_message", { templateId: "t-msg-founder" })],
  },
  {
    id: "seq-simple",
    name: "Simple: connect + message",
    description: "Two steps. Good for warm lists.",
    steps: [s("1", "send_invitation", { addNote: false }), s("2", "wait", { days: 1 }), s("3", "send_message", { templateId: "t-msg-founder" })],
  },
  {
    id: "seq-nurture",
    name: "Nurture existing connections",
    description: "For 1st-degree contacts — message and follow up.",
    steps: [s("1", "send_message", { templateId: "t-msg-founder" }), s("2", "wait", { days: 4 }), s("3", "send_message", { templateId: "t-fu-1" })],
  },
];

/** Sequences used by the sample campaigns. */
export const CAMPAIGN_SEQUENCES: Record<string, string> = {
  "cmp-founders": "seq-connect-2fu",
  "cmp-multitouch": "seq-warmup-open",
  "cmp-cfo": "seq-connect-2fu",
  "cmp-agency": "seq-voice",
  "cmp-reengage": "seq-nurture",
  "cmp-hrtech": "seq-warm-connect",
};

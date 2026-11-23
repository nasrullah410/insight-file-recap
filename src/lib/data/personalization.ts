import { PROSPECTS } from "./prospects";
import { hoursAgo } from "./seed";

export type PersonalizationReason = "missing_icebreaker" | "low_confidence" | "manual_review" | "missing_company";

export const REASON_LABEL: Record<PersonalizationReason, string> = {
  missing_icebreaker: "No icebreaker found",
  low_confidence: "AI unsure",
  manual_review: "Campaign asks for review",
  missing_company: "Company unknown",
};

export interface PersonalizationItem {
  id: string;
  tenantId: string;
  prospectId: string;
  campaignId: string;
  accountId: string;
  stepLabel: string;
  templateId: string;
  reason: PersonalizationReason;
  aiSuggestion: string;
  confidence: number; // 0..1
  flaggedAt: string;
}

const SUGGESTIONS = [
  "Saw {{company}} just opened a second office — congrats on the growth.",
  "Your comment on async onboarding last week stuck with me.",
  "Noticed you moved from consulting into an operator role — big shift!",
  "Loved the team photo from the offsite you shared.",
];

const TEMPLATE_FOR: Record<string, string> = {
  hq: "t-msg-founder",
  northwind: "t-agency-msg",
  brightlane: "t-hr-inmail",
};

export const PERSONALIZATION: PersonalizationItem[] = PROSPECTS.filter((p) => p.campaignId && p.accountId && (p.stage === "connected" || p.stage === "queued"))
  .slice(0, 14)
  .map((p, i) => ({
    id: `pz-${i + 1}`,
    tenantId: p.tenantId,
    prospectId: p.id,
    campaignId: p.campaignId ?? "",
    accountId: p.accountId ?? "",
    stepLabel: i % 3 === 0 ? "Step 3 · Message" : i % 3 === 1 ? "Step 2 · InMail" : "Step 5 · Follow-up",
    templateId: TEMPLATE_FOR[p.tenantId] ?? "t-msg-founder",
    reason: (p.icebreaker ? (i % 2 ? "low_confidence" : "manual_review") : "missing_icebreaker") as PersonalizationReason,
    aiSuggestion: SUGGESTIONS[i % SUGGESTIONS.length] ?? "",
    confidence: p.icebreaker ? 0.55 + (i % 4) * 0.08 : 0.32,
    flaggedAt: hoursAgo(1 + i * 2.3),
  }));

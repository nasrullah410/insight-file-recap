export type AiProvider = "gemini" | "claude" | "openai";

export const AI_MODELS: Record<AiProvider, string[]> = {
  gemini: ["gemini-flash-latest", "gemini-pro-latest", "gemini-3.1-flash-lite"],
  claude: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest"],
  openai: ["gpt-4o-mini", "gpt-4o"],
};

export const PROVIDER_LABEL: Record<AiProvider, string> = { gemini: "Google Gemini", claude: "Anthropic Claude", openai: "OpenAI" };

export interface WorkspaceSettings {
  aiProvider: AiProvider;
  aiModel: string;
  senderRole: string;
  tone: string;
  credibility: string;
  companyDescription: string;
  defaultDailyInvites: number;
  defaultWeeklyInvites: number;
  defaultDailyMessages: number;
  randomDelay: [number, number];
  pauseOnReply: boolean;
  skipWeekends: boolean;
  requireApproval: boolean;
  notifyReplies: boolean;
  notifyDisconnects: boolean;
  dailyDigest: boolean;
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  aiProvider: "gemini",
  aiModel: "gemini-flash-latest",
  senderRole: "Head of Partnerships",
  tone: "Friendly, direct, no buzzwords",
  credibility: "Helped 40+ B2B teams book 600+ meetings from LinkedIn",
  companyDescription: "Convrtln runs LinkedIn outreach for B2B teams — profile warm-up, personalised sequences and an SDR approval queue.",
  defaultDailyInvites: 20,
  defaultWeeklyInvites: 100,
  defaultDailyMessages: 80,
  randomDelay: [45, 180],
  pauseOnReply: true,
  skipWeekends: true,
  requireApproval: true,
  notifyReplies: true,
  notifyDisconnects: true,
  dailyDigest: false,
};

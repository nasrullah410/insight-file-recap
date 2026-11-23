/** Lead scoring rules. Pure functions so the UI only reads their output. */
export interface ScoreInput {
  title: string;
  degree: 1 | 2 | 3;
  email: string | null;
  icebreaker: string | null;
  tags: string[];
}

const SENIOR = /(founder|ceo|cfo|coo|cto|owner|chief|managing director|vp|head of|director)/i;

export const HOT_SCORE = 75;
export const WARM_SCORE = 50;

export function leadScore(p: ScoreInput): number {
  let score = 30;
  if (SENIOR.test(p.title)) score += 30;
  if (p.degree === 1) score += 5;
  else if (p.degree === 2) score += 15;
  if (p.email) score += 10;
  if (p.icebreaker) score += 5;
  if (p.tags.includes("hiring") || p.tags.includes("funded")) score += 10;
  if (p.tags.includes("priority")) score += 5;
  return Math.min(100, score);
}

export type ScoreBand = "hot" | "warm" | "cold";

export function scoreBand(score: number): ScoreBand {
  if (score >= HOT_SCORE) return "hot";
  if (score >= WARM_SCORE) return "warm";
  return "cold";
}

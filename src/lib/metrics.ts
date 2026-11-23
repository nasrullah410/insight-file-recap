import { sumHistory, type DayStat, type LinkedInAccount } from "./account-health";

export type RangeKey = "7d" | "14d";
export const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "14d": 14 };

/** Sum every account's daily stats into one series, last `days` days. */
export function aggregateSeries(accounts: LinkedInAccount[], days: number, offset = 0): DayStat[] {
  const byDate = new Map<string, DayStat>();
  for (const a of accounts) {
    const end = a.history.length - offset;
    for (const d of a.history.slice(Math.max(0, end - days), Math.max(0, end))) {
      const cur = byDate.get(d.date) ?? { date: d.date, invites: 0, accepted: 0, messages: 0, replies: 0, views: 0 };
      cur.invites += d.invites;
      cur.accepted += d.accepted;
      cur.messages += d.messages;
      cur.replies += d.replies;
      cur.views += d.views;
      byDate.set(d.date, cur);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateTotals(accounts: LinkedInAccount[], days: number, offset = 0) {
  return accounts.reduce(
    (acc, a) => {
      const s = sumHistory(a.history, days, offset);
      return {
        invites: acc.invites + s.invites,
        accepted: acc.accepted + s.accepted,
        messages: acc.messages + s.messages,
        replies: acc.replies + s.replies,
        views: acc.views + s.views,
      };
    },
    { invites: 0, accepted: 0, messages: 0, replies: 0, views: 0 },
  );
}

export function pct(part: number, whole: number) {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

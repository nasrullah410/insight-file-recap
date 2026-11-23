import { describe, expect, it } from "vitest";

import { getAccountIssues, getAccountStatus, getCampaignHealth, isWithinWorkingHours, type LinkedInAccount } from "./account-health";

const NOW = new Date("2026-11-23T10:00:00Z"); // Monday

function account(overrides: Partial<LinkedInAccount> = {}): LinkedInAccount {
  return {
    id: "a",
    name: "Test",
    headline: "",
    tenantId: "t",
    city: "London",
    timezone: "Europe/London",
    plan: "Premium",
    workingHours: { start: 9, end: 17, days: [1, 2, 3, 4, 5] },
    connection: "connected",
    weeklyInvites: { used: 10, limit: 100 },
    dailyInvites: { used: 2, limit: 20 },
    dailyMessages: { used: 5, limit: 80 },
    inmailCredits: { used: 1, limit: 50 },
    weeklyResetAt: "2026-11-25T10:00:00Z",
    pendingInvites: 50,
    lastSyncAt: NOW.toISOString(),
    history: [],
    ...overrides,
  };
}

describe("account health", () => {
  it("is healthy when within all limits", () => {
    expect(getAccountStatus(account(), NOW)).toBe("healthy");
  });

  it("flags an exhausted weekly invite limit as critical and limited, with reset time", () => {
    const a = account({ weeklyInvites: { used: 100, limit: 100 } });
    const issue = getAccountIssues(a, NOW).find((i) => i.code === "weekly_invite_limit");
    expect(issue?.severity).toBe("critical");
    expect(issue?.detail).toContain("Resets in 2d 0h");
    expect(getAccountStatus(a, NOW)).toBe("limited");
  });

  it("warns when weekly invites reach 85% but not the limit", () => {
    const a = account({ weeklyInvites: { used: 85, limit: 100 } });
    expect(getAccountIssues(a, NOW).map((i) => i.code)).toContain("weekly_invite_near_limit");
    expect(getAccountStatus(a, NOW)).toBe("healthy");
  });

  it("treats an expired session as disconnected", () => {
    expect(getAccountStatus(account({ connection: "session_expired" }), NOW)).toBe("disconnected");
  });

  it("marks no InMail credits as at risk, not limited", () => {
    expect(getAccountStatus(account({ inmailCredits: { used: 50, limit: 50 } }), NOW)).toBe("at_risk");
  });

  it("marks 500+ pending invites as at risk", () => {
    expect(getAccountStatus(account({ pendingInvites: 500 }), NOW)).toBe("at_risk");
  });

  it("checks working hours in the profile's own timezone", () => {
    // 10:00 UTC = 10:00 London (in hours) but 05:00 New York (off hours)
    expect(isWithinWorkingHours(account(), NOW)).toBe(true);
    expect(isWithinWorkingHours(account({ timezone: "America/New_York" }), NOW)).toBe(false);
  });
});

describe("campaign health", () => {
  const ok = account({ id: "ok" });
  const limited = account({ id: "lim", weeklyInvites: { used: 100, limit: 100 } });

  it("is degraded when some sending profiles can't send", () => {
    expect(getCampaignHealth({ status: "active", accountIds: ["ok", "lim"] }, [ok, limited], NOW)).toBe("degraded");
  });

  it("is blocked when no sending profile can send", () => {
    expect(getCampaignHealth({ status: "active", accountIds: ["lim"] }, [ok, limited], NOW)).toBe("blocked");
  });
});

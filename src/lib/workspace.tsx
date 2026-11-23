import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  getAccountIssues,
  getAccountStatus,
  getCampaignHealth,
  type AccountIssue,
  type CampaignHealth,
  type HealthStatus,
  type LinkedInAccount,
} from "./account-health";
import {
  ACCOUNTS,
  ACTIVITY,
  CAMPAIGNS,
  NOW,
  REPLIES,
  TENANTS,
  type Campaign,
  type Tenant,
} from "./demo-data";

export const ALL_WORKSPACES = "all";

interface WorkspaceContextValue {
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceId] = useState<string>(ALL_WORKSPACES);
  const value = useMemo(() => ({ workspaceId, setWorkspaceId }), [workspaceId]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

export interface AccountView extends LinkedInAccount {
  status: HealthStatus;
  issues: AccountIssue[];
  tenant: Tenant | undefined;
}

export interface CampaignView extends Campaign {
  health: CampaignHealth;
  senders: AccountView[];
  tenant: Tenant | undefined;
}

export function tenantById(id: string) {
  return TENANTS.find((t) => t.id === id);
}

/** Everything the dashboard shows, filtered to the selected workspace. */
export function useScopedData() {
  const { workspaceId } = useWorkspace();
  return useMemo(() => {
    const inScope = (tenantId: string) => workspaceId === ALL_WORKSPACES || tenantId === workspaceId;
    const accounts: AccountView[] = ACCOUNTS.filter((a) => inScope(a.tenantId)).map((a) => ({
      ...a,
      status: getAccountStatus(a, NOW),
      issues: getAccountIssues(a, NOW),
      tenant: tenantById(a.tenantId),
    }));
    const campaigns: CampaignView[] = CAMPAIGNS.filter((c) => inScope(c.tenantId)).map((c) => ({
      ...c,
      health: getCampaignHealth(c, ACCOUNTS, NOW),
      senders: accounts.filter((a) => c.accountIds.includes(a.id)),
      tenant: tenantById(c.tenantId),
    }));
    return {
      now: NOW,
      workspaceId,
      tenant: workspaceId === ALL_WORKSPACES ? undefined : tenantById(workspaceId),
      showTenant: workspaceId === ALL_WORKSPACES,
      accounts,
      campaigns,
      replies: REPLIES.filter((r) => inScope(r.tenantId)),
      activity: ACTIVITY.filter((e) => inScope(e.tenantId)),
    };
  }, [workspaceId]);
}

export function accountName(id: string) {
  return ACCOUNTS.find((a) => a.id === id)?.name ?? "Unknown";
}

export function campaignName(id: string) {
  return CAMPAIGNS.find((c) => c.id === id)?.name ?? "Unknown campaign";
}

export function relativeTime(iso: string, now: Date = NOW) {
  const mins = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Filter any tenant-owned list to the selected workspace. */
export function useInScope() {
  const { workspaceId } = useWorkspace();
  return useCallback(
    <T extends { tenantId: string }>(items: T[]): T[] =>
      workspaceId === ALL_WORKSPACES ? items : items.filter((i) => i.tenantId === workspaceId),
    [workspaceId],
  );
}

/** "in 3h" for future times, "3h ago" for past ones. */
export function relativeAny(iso: string, now: Date = NOW) {
  const diff = new Date(iso).getTime() - now.getTime();
  if (diff <= 60_000) return relativeTime(iso, now);
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

/** Fixed-format UTC timestamp so server and browser render the same text. */
export function formatStamp(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${hh}:${mm}`;
}

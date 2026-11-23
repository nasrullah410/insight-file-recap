import { hoursAgo } from "./seed";

export interface TenantAdmin {
  tenantId: string;
  owner: string;
  plan: "Internal" | "Starter" | "Growth" | "Agency";
  seats: { used: number; limit: number };
  profileLimit: number;
  mrr: number;
  status: "active" | "trial" | "past_due";
  createdAt: string;
}

export const TENANT_ADMIN: TenantAdmin[] = [
  { tenantId: "hq", owner: "nasrullah@convrtln.com", plan: "Internal", seats: { used: 5, limit: 10 }, profileLimit: 10, mrr: 0, status: "active", createdAt: hoursAgo(24 * 210) },
  { tenantId: "northwind", owner: "omar@northwindgrowth.co", plan: "Agency", seats: { used: 3, limit: 5 }, profileLimit: 8, mrr: 1190, status: "active", createdAt: hoursAgo(24 * 96) },
  { tenantId: "brightlane", owner: "lina@brightlane.io", plan: "Growth", seats: { used: 3, limit: 3 }, profileLimit: 4, mrr: 590, status: "trial", createdAt: hoursAgo(24 * 12) },
];

export interface SystemService {
  name: string;
  status: "operational" | "degraded" | "down";
  detail: string;
  checkedAt: string;
}

export const SYSTEM_SERVICES: SystemService[] = [
  { name: "Sending engine", status: "operational", detail: "Scheduler tick every 60s", checkedAt: hoursAgo(0.02) },
  { name: "Chrome extension heartbeats", status: "degraded", detail: "1 of 8 profiles silent > 24h", checkedAt: hoursAgo(0.02) },
  { name: "Unipile API", status: "operational", detail: "p95 420ms", checkedAt: hoursAgo(0.05) },
  { name: "AI message writer", status: "operational", detail: "Gemini Flash · 1.2s avg", checkedAt: hoursAgo(0.05) },
  { name: "Reply sync", status: "operational", detail: "Last run 3 min ago", checkedAt: hoursAgo(0.05) },
];

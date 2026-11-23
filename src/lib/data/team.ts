import { hoursAgo } from "./seed";

export type Role = "owner" | "admin" | "member";

export const ROLE_META: Record<Role, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Full workspace control, billing and deletion" },
  admin: { label: "Admin", description: "Manage LinkedIn profiles, settings and team" },
  member: { label: "Member", description: "Create and run campaigns, work the SDR queue" },
};

export const PERMISSIONS: Array<{ label: string; roles: Role[] }> = [
  { label: "Create and run campaigns", roles: ["owner", "admin", "member"] },
  { label: "Approve SDR tasks and reply in inbox", roles: ["owner", "admin", "member"] },
  { label: "Connect or remove LinkedIn profiles", roles: ["owner", "admin"] },
  { label: "Change sending limits and AI settings", roles: ["owner", "admin"] },
  { label: "Invite and remove teammates", roles: ["owner", "admin"] },
  { label: "Billing and delete workspace", roles: ["owner"] },
];

export interface TeamMember {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  accountIds: string[];
  lastActiveAt: string | null;
}

export const TEAM: TeamMember[] = [
  { id: "u-nasrullah", tenantId: "hq", name: "Muhammad Nasrullah", email: "nasrullah@convrtln.com", role: "owner", status: "active", accountIds: [], lastActiveAt: hoursAgo(0.1) },
  { id: "u-sarah", tenantId: "hq", name: "Sarah Khan", email: "sarah@convrtln.com", role: "admin", status: "active", accountIds: ["acc-sarah"], lastActiveAt: hoursAgo(0.5) },
  { id: "u-aisha", tenantId: "hq", name: "Aisha Malik", email: "aisha@convrtln.com", role: "member", status: "active", accountIds: ["acc-aisha"], lastActiveAt: hoursAgo(31) },
  { id: "u-daniel", tenantId: "hq", name: "Daniel Reyes", email: "daniel@convrtln.com", role: "admin", status: "active", accountIds: ["acc-daniel"], lastActiveAt: hoursAgo(3) },
  { id: "u-bilal", tenantId: "hq", name: "Bilal Ahmed", email: "bilal@convrtln.com", role: "member", status: "invited", accountIds: [], lastActiveAt: null },
  { id: "u-omar", tenantId: "northwind", name: "Omar Siddiqui", email: "omar@northwindgrowth.co", role: "owner", status: "active", accountIds: ["acc-omar"], lastActiveAt: hoursAgo(1) },
  { id: "u-emma", tenantId: "northwind", name: "Emma Lawson", email: "emma@northwindgrowth.co", role: "member", status: "active", accountIds: ["acc-emma"], lastActiveAt: hoursAgo(5) },
  { id: "u-james", tenantId: "northwind", name: "James Carter", email: "james@northwindgrowth.co", role: "admin", status: "active", accountIds: ["acc-james"], lastActiveAt: hoursAgo(2) },
  { id: "u-lina", tenantId: "brightlane", name: "Lina Haddad", email: "lina@brightlane.io", role: "owner", status: "active", accountIds: ["acc-lina"], lastActiveAt: hoursAgo(0.8) },
  { id: "u-marco", tenantId: "brightlane", name: "Marco Rossi", email: "marco@brightlane.io", role: "member", status: "active", accountIds: ["acc-marco"], lastActiveAt: hoursAgo(9) },
  { id: "u-felix", tenantId: "brightlane", name: "Felix Vogel", email: "felix@brightlane.io", role: "member", status: "invited", accountIds: [], lastActiveAt: null },
];

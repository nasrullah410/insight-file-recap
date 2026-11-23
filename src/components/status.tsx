import { AlertTriangle, CircleCheck, CirclePause, Gauge, Unplug, OctagonAlert } from "lucide-react";

import type { CampaignHealth, HealthStatus, IssueSeverity } from "@/lib/account-health";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<
  HealthStatus,
  { label: string; variant: "success" | "warning" | "danger" | "info"; dot: string; text: string; bar: string; icon: typeof CircleCheck; hint: string }
> = {
  healthy: { label: "Healthy", variant: "success", dot: "bg-success", text: "text-success", bar: "bg-success", icon: CircleCheck, hint: "Sending normally" },
  at_risk: { label: "At risk", variant: "warning", dot: "bg-warning", text: "text-warning", bar: "bg-warning", icon: AlertTriangle, hint: "Sending, but needs a look" },
  limited: { label: "Limit reached", variant: "info", dot: "bg-info", text: "text-info", bar: "bg-info", icon: Gauge, hint: "Paused by a LinkedIn limit" },
  disconnected: { label: "Disconnected", variant: "danger", dot: "bg-destructive", text: "text-destructive", bar: "bg-destructive", icon: Unplug, hint: "Not sending — action needed" },
};

export const STATUS_ORDER: HealthStatus[] = ["disconnected", "limited", "at_risk", "healthy"];

export function StatusBadge({ status, className }: { status: HealthStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className={className}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export function StatusDot({ status, className }: { status: HealthStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn("relative block size-2.5 rounded-full ring-2 ring-card", meta.dot, meta.text, className)}
      aria-label={meta.label}
    />
  );
}

export const CAMPAIGN_HEALTH_META: Record<
  CampaignHealth,
  { label: string; variant: "success" | "warning" | "danger" | "muted"; icon: typeof CircleCheck }
> = {
  running: { label: "Running", variant: "success", icon: CircleCheck },
  degraded: { label: "Degraded", variant: "warning", icon: AlertTriangle },
  blocked: { label: "Blocked", variant: "danger", icon: OctagonAlert },
  paused: { label: "Paused", variant: "muted", icon: CirclePause },
};

export function CampaignHealthBadge({ health }: { health: CampaignHealth }) {
  const meta = CAMPAIGN_HEALTH_META[health];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

export const SEVERITY_META: Record<IssueSeverity, { label: string; text: string; bg: string; border: string }> = {
  critical: { label: "Critical", text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  warning: { label: "Warning", text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  info: { label: "Heads up", text: "text-info", bg: "bg-info/10", border: "border-info/30" },
};

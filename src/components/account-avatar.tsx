import type { HealthStatus } from "@/lib/account-health";
import { cn } from "@/lib/utils";
import { StatusDot } from "./status";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AccountAvatar({
  name,
  status,
  size = "md",
  className,
}: {
  name: string;
  status?: HealthStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 self-start", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-border-strong bg-elevated font-display font-semibold text-foreground",
          size === "sm" && "size-7 text-[10px]",
          size === "md" && "size-9 text-xs",
          size === "lg" && "size-12 text-sm",
        )}
      >
        {initials(name)}
      </span>
      {status && <StatusDot status={status} className="absolute -right-0.5 -bottom-0.5" />}
    </span>
  );
}

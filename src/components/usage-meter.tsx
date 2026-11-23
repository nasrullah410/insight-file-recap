import { isExhausted, NEAR_LIMIT_RATIO, usageRatio, type Usage } from "@/lib/account-health";
import { cn } from "@/lib/utils";

export function UsageMeter({
  label,
  usage,
  hint,
  compact = false,
}: {
  label: string;
  usage: Usage;
  hint?: string;
  compact?: boolean;
}) {
  const ratio = usageRatio(usage);
  const full = isExhausted(usage);
  const near = !full && ratio >= NEAR_LIMIT_RATIO;
  const tone = full ? "bg-destructive" : near ? "bg-warning" : "bg-primary";
  const text = full ? "text-destructive" : near ? "text-warning" : "text-foreground";
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("truncate text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>{label}</span>
        <span className={cn("num shrink-0", compact ? "text-[11px]" : "text-xs", text)}>
          {usage.used}
          <span className="text-subtle-foreground">/{usage.limit}</span>
        </span>
      </div>
      <div className={cn("mt-1.5 overflow-hidden rounded-full bg-muted", compact ? "h-1" : "h-1.5")}>
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.max(ratio * 100, 2)}%` }} />
      </div>
      {hint && <p className={cn("mt-1 text-[11px] whitespace-nowrap", full ? "text-destructive" : "text-subtle-foreground")}>{hint}</p>}
    </div>
  );
}

/** Compact meter for table cells: "81/150" with a thin bar underneath. */
export function MiniMeter({ usage, hint }: { usage: Usage; hint?: string }) {
  const ratio = usageRatio(usage);
  const full = isExhausted(usage);
  const near = !full && ratio >= NEAR_LIMIT_RATIO;
  return (
    <div className="w-[84px]">
      <p className={cn("num text-[13px]", full ? "font-semibold text-destructive" : near ? "font-medium text-warning" : "text-foreground")}>
        {usage.used}
        <span className="font-normal text-subtle-foreground">/{usage.limit}</span>
      </p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", full ? "bg-destructive" : near ? "bg-warning" : "bg-primary")}
          style={{ width: `${Math.max(ratio * 100, 2)}%` }}
        />
      </div>
      {hint && <p className={cn("mt-1 text-[11px] whitespace-nowrap", full ? "text-destructive" : "text-subtle-foreground")}>{hint}</p>}
    </div>
  );
}

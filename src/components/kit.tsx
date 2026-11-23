import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Table header cell style shared by every dense table. */
export const TH = "bg-elevated px-3 py-2.5 text-left text-[12px] font-medium whitespace-nowrap text-muted-foreground";
export const TD = "px-3 py-3 align-middle";

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted p-0.5" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[13px] font-medium transition-colors",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="num text-[11px] text-subtle-foreground">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={cn("relative md:w-72", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 rounded-md border-border bg-card pl-9 text-[13px] shadow-sm"
      />
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-2 p-10 text-center">
      {icon && <div className="text-subtle-foreground [&_svg]:size-6">{icon}</div>}
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-sm text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export type StatTone = "default" | "success" | "warning" | "danger" | "info" | "primary";
const STAT_TONE: Record<StatTone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  primary: "text-primary",
};

export function StatStrip({ items }: { items: Array<{ label: string; value: ReactNode; hint?: string; tone?: StatTone }> }) {
  return (
    <div className={cn("panel grid grid-cols-2 divide-border md:divide-x", items.length >= 5 ? "md:grid-cols-5" : items.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
      {items.map((it) => (
        <div key={it.label} className="p-4">
          <p className="text-[12px] text-muted-foreground">{it.label}</p>
          <p className={cn("num mt-1.5 text-[22px] leading-none font-semibold", STAT_TONE[it.tone ?? "default"])}>{it.value}</p>
          {it.hint && <p className="mt-1.5 text-[11px] text-subtle-foreground">{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function PanelHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Message body with {{variables}} highlighted. */
export function HighlightedMessage({ parts, className }: { parts: Array<{ text: string; variable: boolean }>; className?: string }) {
  return (
    <p className={cn("text-[13px] leading-relaxed whitespace-pre-wrap text-foreground", className)}>
      {parts.map((p, i) =>
        p.variable ? (
          <span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PersonAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-8 text-[11px]",
        size === "lg" && "size-11 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}

import { Badge } from "@/components/ui/badge";
import type { ProspectStage } from "@/lib/data/prospects";
import { scoreBand } from "@/lib/prospect-rules";
import { cn } from "@/lib/utils";

export const STAGE_META: Record<ProspectStage, { label: string; variant: "muted" | "info" | "signal" | "success" | "warning" | "outline" }> = {
  new: { label: "New", variant: "outline" },
  queued: { label: "Queued", variant: "muted" },
  invited: { label: "Invite sent", variant: "info" },
  connected: { label: "Connected", variant: "signal" },
  messaged: { label: "Messaged", variant: "signal" },
  replied: { label: "Replied", variant: "success" },
  meeting: { label: "Meeting booked", variant: "success" },
  not_interested: { label: "Not interested", variant: "warning" },
};

export function StageBadge({ stage }: { stage: ProspectStage }) {
  const m = STAGE_META[stage];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function ScorePill({ score }: { score: number }) {
  const band = scoreBand(score);
  return (
    <span
      className={cn(
        "num inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-[12px] font-semibold",
        band === "hot" && "bg-success/10 text-success",
        band === "warm" && "bg-warning/10 text-warning",
        band === "cold" && "bg-muted text-muted-foreground",
      )}
      title={`Lead score ${score} (${band})`}
    >
      {score}
    </span>
  );
}

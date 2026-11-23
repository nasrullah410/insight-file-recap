import { Link } from "@tanstack/react-router";
import { Building2, Linkedin, Mail, MapPin, Sparkles } from "lucide-react";

import { PersonAvatar } from "@/components/kit";
import { ScorePill, StageBadge } from "@/components/stage";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ACTIVITY_LOG, LOG_KIND_LABEL } from "@/lib/data/activity-log";
import { fullName, LISTS, type Prospect } from "@/lib/data/prospects";
import { scoreBand } from "@/lib/prospect-rules";
import { accountName, campaignName, formatStamp } from "@/lib/workspace";

export function ProspectSheet({ prospect, onClose }: { prospect: Prospect | undefined; onClose: () => void }) {
  const log = prospect ? ACTIVITY_LOG.filter((e) => e.prospectId === prospect.id).slice(0, 8) : [];
  return (
    <Sheet open={!!prospect} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {prospect && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3">
                <PersonAvatar name={fullName(prospect)} size="lg" />
                <div>
                  <SheetTitle>{fullName(prospect)}</SheetTitle>
                  <SheetDescription>{prospect.title}</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="mt-5 space-y-5 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <StageBadge stage={prospect.stage} />
                <ScorePill score={prospect.score} />
                <span className="text-[12px] text-muted-foreground capitalize">{scoreBand(prospect.score)} lead</span>
                <span className="text-[12px] text-muted-foreground">· {prospect.degree === 1 ? "1st" : prospect.degree === 2 ? "2nd" : "3rd"} degree</span>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><Building2 className="size-4" />{prospect.company} · {prospect.industry}</li>
                <li className="flex items-center gap-2"><MapPin className="size-4" />{prospect.location}</li>
                <li className="flex items-center gap-2"><Mail className="size-4" />{prospect.email ?? "No email found"}</li>
                <li className="flex items-center gap-2"><Linkedin className="size-4 text-linkedin" />linkedin.com/in/{prospect.firstName.toLowerCase()}-{prospect.lastName.toLowerCase()}</li>
              </ul>
              <div className="rounded-md border border-border bg-elevated p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-primary"><Sparkles className="size-3.5" />Icebreaker</p>
                <p>{prospect.icebreaker ?? <span className="text-muted-foreground">None found yet — this prospect will be flagged for personalization.</span>}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-[12px] text-subtle-foreground">List</dt><dd>{LISTS.find((l) => l.id === prospect.listId)?.name}</dd></div>
                <div>
                  <dt className="text-[12px] text-subtle-foreground">Campaign</dt>
                  <dd>
                    {prospect.campaignId ? (
                      <Link to="/campaigns/$campaignId" params={{ campaignId: prospect.campaignId }} className="text-primary hover:underline">{campaignName(prospect.campaignId)}</Link>
                    ) : "Not enrolled"}
                  </dd>
                </div>
                <div><dt className="text-[12px] text-subtle-foreground">Sending profile</dt><dd>{prospect.accountId ? accountName(prospect.accountId) : "—"}</dd></div>
                <div><dt className="text-[12px] text-subtle-foreground">Added</dt><dd>{formatStamp(prospect.addedAt)}</dd></div>
              </dl>
              <div>
                <p className="mb-2 font-medium">History</p>
                {log.length === 0 ? (
                  <p className="text-muted-foreground">No actions yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {log.map((e) => (
                      <li key={e.id} className="flex justify-between gap-3">
                        <span>{LOG_KIND_LABEL[e.kind]}</span>
                        <span className="num text-[12px] text-subtle-foreground">{formatStamp(e.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

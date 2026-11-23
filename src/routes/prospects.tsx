import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, FileUp, ListPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState, PersonAvatar, SearchBox, SegmentedTabs, TD, TH } from "@/components/kit";
import { PageHeader } from "@/components/page-header";
import { ImportDialog } from "@/components/prospects/import-dialog";
import { ProspectSheet } from "@/components/prospects/prospect-sheet";
import { ScorePill, STAGE_META, StageBadge } from "@/components/stage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fullName, LISTS, PROSPECTS, STAGE_ORDER, type ProspectStage } from "@/lib/data/prospects";
import { scoreBand, type ScoreBand } from "@/lib/prospect-rules";
import { pageHead } from "@/lib/seo";
import { campaignName, relativeTime, useInScope, useScopedData } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prospects")({
  validateSearch: z.object({ prospect: z.string().optional().catch(undefined) }),
  head: () => pageHead("Prospects & lists", "Every prospect across your lists with lead score, campaign stage and contact details."),
  component: ProspectsPage,
});

type Band = "all" | ScoreBand;

function ProspectsPage() {
  const { prospect: selectedId } = Route.useSearch();
  const navigate = useNavigate({ from: "/prospects" });
  const scope = useInScope();
  const { campaigns, now, showTenant } = useScopedData();
  const all = useMemo(() => scope(PROSPECTS), [scope]);
  const lists = useMemo(() => scope(LISTS), [scope]);
  const [listId, setListId] = useState<string>("all");
  const [stage, setStage] = useState<"all" | ProspectStage>("all");
  const [band, setBand] = useState<Band>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  const inList = all.filter((p) => listId === "all" || p.listId === listId);
  const q = query.trim().toLowerCase();
  const visible = inList
    .filter((p) => (stage === "all" || p.stage === stage) && (band === "all" || scoreBand(p.score) === band))
    .filter((p) => !q || fullName(p).toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.title.toLowerCase().includes(q))
    .sort((a, b) => b.score - a.score);
  const allChecked = visible.length > 0 && visible.every((p) => selected.includes(p.id));
  const currentList = lists.find((l) => l.id === listId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prospects & lists"
        description="Everyone you've imported, scored and ready to enroll in a campaign."
        actions={
          <Button size="sm" onClick={() => setImportOpen(true)}>
            <FileUp /> Import CSV
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        <aside className="panel h-fit p-2">
          <p className="eyebrow px-2 pt-1 pb-2">Lists</p>
          {[{ id: "all", name: "All prospects", source: "" }, ...lists].map((l) => {
            const n = l.id === "all" ? all.length : all.filter((p) => p.listId === l.id).length;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setListId(l.id);
                  setSelected([]);
                }}
                className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors", listId === l.id ? "bg-accent font-medium text-primary" : "hover:bg-accent/50")}
              >
                <Users className="size-3.5 shrink-0 text-subtle-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{l.name}</span>
                  {l.source && <span className="block text-[11px] text-subtle-foreground">{l.source}</span>}
                </span>
                <span className="num text-[11px] text-subtle-foreground">{n}</span>
              </button>
            );
          })}
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SegmentedTabs
              label="Lead score"
              value={band}
              onChange={setBand}
              options={(["all", "hot", "warm", "cold"] as Band[]).map((b) => ({ value: b, label: b === "all" ? "All scores" : b[0]?.toUpperCase() + b.slice(1), count: b === "all" ? inList.length : inList.filter((p) => scoreBand(p.score) === b).length }))}
            />
            <div className="flex flex-wrap gap-2">
              <Select value={stage} onValueChange={(v) => setStage(v as "all" | ProspectStage)}>
                <SelectTrigger className="h-8 w-40 bg-card text-[13px]" aria-label="Stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {STAGE_ORDER.map((s) => <SelectItem key={s} value={s}>{STAGE_META[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
              <SearchBox value={query} onChange={setQuery} placeholder="Search name, company, title" className="md:w-64" />
            </div>
          </div>

          {selected.length > 0 && (
            <div className="panel flex flex-wrap items-center gap-2 px-4 py-2 text-[13px]">
              <span className="font-medium">{selected.length} selected</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="soft"><ListPlus /> Add to campaign</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Enroll in</DropdownMenuLabel>
                  {campaigns.filter((c) => c.status !== "paused").map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onSelect={() => {
                        toast.success(`${selected.length} prospects added to “${c.name}”`);
                        setSelected([]);
                      }}
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="soft" onClick={() => toast.success(`Exported ${selected.length} prospects to CSV`)}><Download /> Export</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState title="No prospects match" hint="Change the filters or import a CSV." />
          ) : (
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-[13px]">
                  <thead className="border-b border-border">
                    <tr>
                      <th className={cn(TH, "w-10 pl-5")}>
                        <Checkbox checked={allChecked} onCheckedChange={() => setSelected(allChecked ? [] : visible.map((p) => p.id))} aria-label="Select all" />
                      </th>
                      <th className={TH}>Prospect</th>
                      <th className={TH}>Company</th>
                      <th className={TH}>Score</th>
                      <th className={TH}>Stage</th>
                      <th className={TH}>Campaign</th>
                      <th className={cn(TH, "pr-5")}>Last touch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((p) => (
                      <tr key={p.id} className={cn("cursor-pointer transition-colors hover:bg-accent/40", selected.includes(p.id) && "bg-accent/30")} onClick={() => navigate({ search: { prospect: p.id } })}>
                        <td className={cn(TD, "pl-5")} onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => setSelected((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))} aria-label={`Select ${fullName(p)}`} />
                        </td>
                        <td className={TD}>
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar name={fullName(p)} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{fullName(p)}</p>
                              <p className="max-w-[220px] truncate text-[12px] text-subtle-foreground">{p.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className={TD}>
                          <p>{p.company}</p>
                          <p className="text-[12px] text-subtle-foreground">{p.location}</p>
                        </td>
                        <td className={TD}><ScorePill score={p.score} /></td>
                        <td className={TD}><StageBadge stage={p.stage} /></td>
                        <td className={cn(TD, "max-w-[200px] truncate text-muted-foreground")}>
                          {p.campaignId ? campaignName(p.campaignId) : "—"}
                          {showTenant && <span className="block text-[11px] text-subtle-foreground">{lists.find((l) => l.id === p.listId)?.name}</span>}
                        </td>
                        <td className={cn(TD, "pr-5 text-muted-foreground")}>{p.lastTouchAt ? relativeTime(p.lastTouchAt, now) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProspectSheet prospect={all.find((p) => p.id === selectedId)} onClose={() => navigate({ search: { prospect: undefined } })} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} listName={currentList?.name ?? lists[0]?.name ?? "New list"} />
    </div>
  );
}

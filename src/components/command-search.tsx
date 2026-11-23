import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckSquare, FileText, Megaphone, Search, UserSquare2 } from "lucide-react";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { fullName, PROSPECTS } from "@/lib/data/prospects";
import { TASK_TYPE_LABEL, TASKS } from "@/lib/data/tasks";
import { TEMPLATE_KIND_LABEL, TEMPLATES } from "@/lib/data/templates";
import { useInScope, useScopedData } from "@/lib/workspace";

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const scope = useInScope();
  const { campaigns } = useScopedData();
  const prospects = useMemo(() => scope(PROSPECTS), [scope]);
  const tasks = useMemo(() => scope(TASKS).filter((t) => t.status === "pending_approval"), [scope]);
  const templates = useMemo(() => scope(TEMPLATES), [scope]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 w-72 items-center gap-2 rounded-md border border-border bg-card px-3 text-[13px] text-subtle-foreground shadow-sm transition-colors hover:border-border-strong md:flex"
      >
        <Search className="size-4" />
        Search prospects, campaigns…
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="inline-flex size-8 items-center justify-center rounded-md border border-border md:hidden"
      >
        <Search className="size-4" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search prospects, campaigns, tasks and templates…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Campaigns">
            {campaigns.map((c) => (
              <CommandItem key={c.id} value={`campaign ${c.name}`} onSelect={() => go(() => navigate({ to: "/campaigns/$campaignId", params: { campaignId: c.id } }))}>
                <Megaphone className="text-muted-foreground" />
                <span className="truncate">{c.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Prospects">
            {prospects.slice(0, 60).map((p) => (
              <CommandItem key={p.id} value={`prospect ${fullName(p)} ${p.company} ${p.title}`} onSelect={() => go(() => navigate({ to: "/prospects", search: { prospect: p.id } }))}>
                <UserSquare2 className="text-muted-foreground" />
                <span className="truncate">{fullName(p)}</span>
                <span className="ml-auto truncate text-[12px] text-subtle-foreground">{p.company}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="SDR tasks">
            {tasks.slice(0, 20).map((t) => {
              const p = PROSPECTS.find((x) => x.id === t.prospectId);
              return (
                <CommandItem key={t.id} value={`task ${TASK_TYPE_LABEL[t.type]} ${p ? fullName(p) : ""}`} onSelect={() => go(() => navigate({ to: "/tasks", search: { task: t.id } }))}>
                  <CheckSquare className="text-muted-foreground" />
                  <span className="truncate">{TASK_TYPE_LABEL[t.type]} · {p ? fullName(p) : "Prospect"}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Templates">
            {templates.map((t) => (
              <CommandItem key={t.id} value={`template ${t.name} ${TEMPLATE_KIND_LABEL[t.kind]}`} onSelect={() => go(() => navigate({ to: "/templates", search: { template: t.id } }))}>
                <FileText className="text-muted-foreground" />
                <span className="truncate">{t.name}</span>
                <span className="ml-auto text-[12px] text-subtle-foreground">{TEMPLATE_KIND_LABEL[t.kind]}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

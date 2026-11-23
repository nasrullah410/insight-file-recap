import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  CheckSquare,
  ChevronRight,
  FileText,
  Inbox,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  Menu,
  Reply,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  UserSquare2,
  Zap,
} from "lucide-react";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { CommandSearch } from "@/components/command-search";
import { CONVERSATIONS } from "@/lib/data/conversations";
import { PERSONALIZATION } from "@/lib/data/personalization";
import { TASKS } from "@/lib/data/tasks";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TENANTS } from "@/lib/demo-data";
import { ALL_WORKSPACES, relativeTime, useInScope, useScopedData, useWorkspace } from "@/lib/workspace";

type NavTo = keyof FileRoutesByTo;
import { cn } from "@/lib/utils";

const PAGE_TITLES: Array<[string, string]> = [
  ["/accounts/", "Profile network"],
  ["/accounts", "LinkedIn accounts"],
  ["/activity", "Activity log"],
  ["/campaigns/new", "New campaign"],
  ["/campaigns/", "Campaign"],
  ["/campaigns", "Campaigns"],
  ["/templates", "Templates"],
  ["/tasks", "SDR Task Center"],
  ["/personalization", "Needs personalization"],
  ["/queue", "Sending queue"],
  ["/prospects", "Prospects & lists"],
  ["/replies", "Replies"],
  ["/inbox", "Inbox"],
  ["/team", "Team & roles"],
  ["/admin", "Super-admin"],
  ["/settings", "Settings"],
];

function pageTitle(pathname: string) {
  if (pathname === "/") return "Overview";
  return PAGE_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Page";
}

function WorkspaceSwitcher() {
  const { workspaceId, setWorkspaceId } = useWorkspace();
  return (
    <Select value={workspaceId} onValueChange={setWorkspaceId}>
      <SelectTrigger aria-label="Workspace" className="h-9 w-full rounded-md border-border bg-card text-[13px] font-medium shadow-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_WORKSPACES}>
          <span className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground" /> All workspaces
          </span>
        </SelectItem>
        {TENANTS.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <span className="flex items-center gap-2">
              <span className="inline-flex size-4 items-center justify-center rounded bg-muted text-[9px] font-semibold text-muted-foreground">
                {t.short}
              </span>
              {t.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { accounts } = useScopedData();
  const scope = useInScope();
  const needsAttention = accounts.filter((a) => a.status !== "healthy").length;
  const openTasks = scope(TASKS).filter((t) => t.status === "pending_approval").length;
  const toPersonalize = scope(PERSONALIZATION).length;
  const unread = scope(CONVERSATIONS).filter((c) => c.unread && !c.archived).length;
  const itemClass =
    "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:text-subtle-foreground";
  const activeClass = "bg-accent text-primary [&_svg]:text-primary hover:bg-accent hover:text-primary";
  const count = (n: number, tone: "warning" | "primary" = "primary") =>
    n > 0 ? (
      <span className={cn("num ml-auto rounded-full px-1.5 text-[11px] font-semibold", tone === "warning" ? "bg-warning/12 text-warning" : "bg-primary/10 text-primary")}>{n}</span>
    ) : null;
  const link = (to: NavTo, label: string, Icon: typeof Zap, badge?: ReactNode, exact = false) => (
    <Link key={to} to={to} onClick={onNavigate} className={itemClass} activeProps={{ className: activeClass }} activeOptions={{ exact }}>
      <Icon /> {label}
      {badge}
    </Link>
  );
  return (
    <nav className="space-y-5">
      <div className="space-y-0.5">
        <span className="eyebrow block px-2.5 pb-1.5">Monitor</span>
        {link("/", "Overview", LayoutDashboard, undefined, true)}
        {link("/accounts", "LinkedIn accounts", Zap, count(needsAttention, "warning"))}
        {link("/activity", "Activity log", Activity)}
      </div>
      <div className="space-y-0.5">
        <span className="eyebrow block px-2.5 pb-1.5">Outreach</span>
        {link("/campaigns", "Campaigns", Megaphone)}
        {link("/templates", "Templates", FileText)}
        {link("/tasks", "SDR Task Center", CheckSquare, count(openTasks))}
        {link("/personalization", "Needs personalization", Sparkles, count(toPersonalize, "warning"))}
        {link("/queue", "Sending queue", ListOrdered)}
      </div>
      <div className="space-y-0.5">
        <span className="eyebrow block px-2.5 pb-1.5">Pipeline</span>
        {link("/prospects", "Prospects & lists", UserSquare2)}
        {link("/replies", "Replies", Reply)}
        {link("/inbox", "Inbox", Inbox, count(unread))}
      </div>
      <div className="space-y-0.5">
        <span className="eyebrow block px-2.5 pb-1.5">Admin</span>
        {link("/team", "Team & roles", Users)}
        {link("/admin", "Super-admin", ShieldCheck)}
        {link("/settings", "Settings", Settings)}
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="brand-tile inline-flex size-7 items-center justify-center rounded-md">
        <Zap className="size-4" strokeWidth={2.5} fill="currentColor" />
      </span>
      <p className="text-[15px] font-semibold tracking-tight text-foreground">Convrtln</p>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { accounts } = useScopedData();
  const sending = accounts.filter((a) => a.status === "healthy" || a.status === "at_risk").length;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Brand />
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        <WorkspaceSwitcher />
        <NavLinks {...(onNavigate ? { onNavigate } : {})} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 px-1 text-[12px] text-muted-foreground">
          <span className="pulse-dot relative block size-2 rounded-full bg-success text-success" />
          Sending engine online
          <span className="num ml-auto text-subtle-foreground">
            {sending}/{accounts.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { tenant, now } = useScopedData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenu}
        className="inline-flex size-8 items-center justify-center rounded-md border border-border lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </button>
      <div className="lg:hidden">
        <Brand />
      </div>
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-[13px] lg:flex">
        <span className="text-muted-foreground">{tenant ? tenant.name : "All workspaces"}</span>
        <ChevronRight className="size-3.5 text-subtle-foreground" />
        <span className="font-medium text-foreground">{pageTitle(pathname)}</span>
      </nav>
      <div className="ml-auto flex items-center gap-3 text-[12px] text-muted-foreground">
        <CommandSearch />
        <span className="block size-1.5 rounded-full bg-success" />
        <span className="hidden xl:inline">Synced {relativeTime(new Date(now.getTime() - 120_000).toISOString(), now)}</span>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        <TopBar onMenu={() => setOpen(true)} />
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

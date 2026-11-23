import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { z } from "zod";

import { AccountCard } from "@/components/accounts/account-card";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { AccountDetailSheet } from "@/components/accounts/account-detail-sheet";
import { PageHeader } from "@/components/page-header";
import { STATUS_META, STATUS_ORDER } from "@/components/status";
import { UsageMeter } from "@/components/usage-meter";
import { Input } from "@/components/ui/input";
import type { HealthStatus } from "@/lib/account-health";
import { useScopedData } from "@/lib/workspace";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "attention", "healthy", "at_risk", "limited", "disconnected"] as const;
type Filter = (typeof FILTERS)[number];

const searchSchema = z.object({
  status: z.enum(FILTERS).optional().catch(undefined),
  account: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/accounts")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "LinkedIn accounts — Convrtln Outreach OS" },
      { name: "description", content: "Health, sending limits and problems for every connected LinkedIn profile, across all workspaces." },
      { property: "og:title", content: "LinkedIn accounts — Convrtln Outreach OS" },
      { property: "og:description", content: "Health, sending limits and problems for every connected LinkedIn profile, across all workspaces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountsPage,
});

const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  attention: "Needs attention",
  healthy: STATUS_META.healthy.label,
  at_risk: STATUS_META.at_risk.label,
  limited: STATUS_META.limited.label,
  disconnected: STATUS_META.disconnected.label,
};

const RANK: Record<HealthStatus, number> = { disconnected: 0, limited: 1, at_risk: 2, healthy: 3 };

function AccountsPage() {
  const { status, account: selectedId } = Route.useSearch();
  const filter: Filter = status ?? "all";
  const navigate = useNavigate({ from: "/accounts" });
  const { accounts, campaigns, showTenant, now } = useScopedData();
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: accounts.length, attention: 0, healthy: 0, at_risk: 0, limited: 0, disconnected: 0 };
    for (const a of accounts) {
      c[a.status] += 1;
      if (a.status !== "healthy") c.attention += 1;
    }
    return c;
  }, [accounts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts
      .filter((a) => (filter === "all" ? true : filter === "attention" ? a.status !== "healthy" : a.status === filter))
      .filter((a) => !q || a.name.toLowerCase().includes(q) || (a.tenant?.name.toLowerCase().includes(q) ?? false))
      .sort((a, b) => RANK[a.status] - RANK[b.status] || b.issues.length - a.issues.length);
  }, [accounts, filter, query]);

  const weekly = accounts.reduce((acc, a) => ({ used: acc.used + a.weeklyInvites.used, limit: acc.limit + a.weeklyInvites.limit }), { used: 0, limit: 0 });
  const inmail = accounts.reduce((acc, a) => ({ used: acc.used + a.inmailCredits.used, limit: acc.limit + a.inmailCredits.limit }), { used: 0, limit: 0 });
  const selected = accounts.find((a) => a.id === selectedId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="LinkedIn accounts"
        description="Every connected profile, its sending limits and anything that's stopping it from sending."
      />

      <div className="panel grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x xl:grid-cols-6">
        {[...STATUS_ORDER].reverse().map((s) => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const active = filter === s;
          return (
            <Link
              key={s}
              to="/accounts"
              search={{ status: active ? undefined : s }}
              className={cn(
                "relative p-4 transition-colors hover:bg-accent/40",
                active && "bg-accent/60 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary",
              )}
            >
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Icon className={cn("size-3.5", meta.text)} />
                {meta.label}
              </div>
              <p className="num mt-1.5 text-[24px] leading-none font-semibold text-foreground">{counts[s]}</p>
              <p className="mt-1.5 text-[11px] text-subtle-foreground">{meta.hint}</p>
            </Link>
          );
        })}
        <div className="col-span-2 space-y-3 border-t border-border p-4 md:col-span-4 xl:col-span-2 xl:border-t-0">
          <UsageMeter label="Weekly invite capacity used" usage={weekly} />
          <UsageMeter label="InMail credits used this month" usage={inmail} />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted p-0.5" role="tablist" aria-label="Filter accounts">
          {FILTERS.map((f) => (
            <Link
              key={f}
              to="/accounts"
              search={{ status: f === "all" ? undefined : f }}
              role="tab"
              aria-selected={filter === f}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[13px] font-medium transition-colors",
                filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {FILTER_LABEL[f]}
              <span className="num text-[11px] text-subtle-foreground">{counts[f]}</span>
            </Link>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search profile or workspace"
            className="h-8 rounded-md border-border bg-card pl-9 text-[13px] shadow-sm"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="panel p-10 text-center text-[13px] text-muted-foreground">No profiles match this filter.</div>
      ) : (
        <>
          <div className="hidden lg:block">
            <AccountsTable accounts={visible} now={now} showTenant={showTenant} />
          </div>
          <div className="space-y-3 lg:hidden">
            {visible.map((a) => (
              <AccountCard key={a.id} account={a} now={now} showTenant={showTenant} />
            ))}
          </div>
        </>
      )}

      <AccountDetailSheet
        account={selected}
        campaigns={campaigns}
        now={now}
        onClose={() => navigate({ search: (prev) => ({ ...prev, account: undefined }) })}
      />
    </div>
  );
}

import { leadScore } from "../prospect-rules";
import { CAMPAIGNS } from "../demo-data";
import { COMPANIES, FIRST_NAMES, hoursAgo, INDUSTRIES, LAST_NAMES, LOCATIONS, pick, rng, TITLES } from "./seed";

export type ProspectStage = "new" | "queued" | "invited" | "connected" | "messaged" | "replied" | "meeting" | "not_interested";

export const STAGE_ORDER: ProspectStage[] = ["new", "queued", "invited", "connected", "messaged", "replied", "meeting", "not_interested"];

export interface ProspectList {
  id: string;
  tenantId: string;
  name: string;
  source: "Sales Navigator" | "CSV import" | "Website scrape" | "Manual";
  createdAt: string;
}

export interface Prospect {
  id: string;
  tenantId: string;
  listId: string;
  campaignId: string | null;
  accountId: string | null;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  degree: 1 | 2 | 3;
  stage: ProspectStage;
  email: string | null;
  icebreaker: string | null;
  tags: string[];
  addedAt: string;
  lastTouchAt: string | null;
  score: number;
}

export const LISTS: ProspectList[] = [
  { id: "lst-eu-founders", tenantId: "hq", name: "EU Founders 2nd-degree", source: "Sales Navigator", createdAt: hoursAgo(24 * 21) },
  { id: "lst-hq-webinar", tenantId: "hq", name: "Webinar sign-ups Nov", source: "CSV import", createdAt: hoursAgo(24 * 9) },
  { id: "lst-us-cfo", tenantId: "northwind", name: "US Series A CFOs", source: "Sales Navigator", createdAt: hoursAgo(24 * 27) },
  { id: "lst-uk-agency", tenantId: "northwind", name: "UK agency owners", source: "Website scrape", createdAt: hoursAgo(24 * 18) },
  { id: "lst-dach-hr", tenantId: "brightlane", name: "DACH HR buyers", source: "Sales Navigator", createdAt: hoursAgo(24 * 15) },
  { id: "lst-bl-events", tenantId: "brightlane", name: "HR Tech Expo leads", source: "Manual", createdAt: hoursAgo(24 * 6) },
];

const ICEBREAKERS = [
  "Saw your post on scaling finance ops without adding headcount.",
  "Congrats on the recent funding round!",
  "Loved your take on async onboarding at the HR Tech panel.",
  "Noticed you're hiring three SDRs this quarter.",
  null,
  null,
];

/** Prospects who appear in replies and the activity feed, so every page links up. */
const NAMED: Array<Partial<Prospect> & Pick<Prospect, "id" | "tenantId" | "firstName" | "lastName" | "title" | "campaignId" | "accountId" | "stage">> = [
  { id: "p-tara", tenantId: "northwind", firstName: "Tara", lastName: "Nixon", title: "Business Development Director", company: "Brandforge", campaignId: "cmp-agency", accountId: "acc-omar", stage: "replied" },
  { id: "p-antonio", tenantId: "hq", firstName: "Antonio", lastName: "Velkovski", title: "Founder & CEO", company: "Stackhaus", campaignId: "cmp-founders", accountId: "acc-sarah", stage: "replied" },
  { id: "p-ingmar", tenantId: "brightlane", firstName: "Ingmar", lastName: "Mier", title: "Managing Director", company: "Peoplepath", campaignId: "cmp-hrtech", accountId: "acc-marco", stage: "not_interested" },
  { id: "p-dave", tenantId: "hq", firstName: "Dave", lastName: "Miller", title: "Co-founder / Chief Success Wizard", company: "Orbitly", campaignId: "cmp-multitouch", accountId: "acc-daniel", stage: "meeting" },
  { id: "p-peter", tenantId: "northwind", firstName: "Peter", lastName: "Buijs", title: "CFO", company: "Payzen", campaignId: "cmp-cfo", accountId: "acc-james", stage: "replied" },
  { id: "p-klara", tenantId: "brightlane", firstName: "Klara", lastName: "Hoffmann", title: "Head of People", company: "Kindred HR", campaignId: "cmp-hrtech", accountId: "acc-lina", stage: "replied" },
  { id: "p-sunil", tenantId: "hq", firstName: "Sunil", lastName: "Chandarana", title: "Founder", company: "Cloudmint", campaignId: "cmp-founders", accountId: "acc-sarah", stage: "messaged" },
  { id: "p-jahid", tenantId: "northwind", firstName: "Jahid", lastName: "Sajon", title: "Agency Owner", company: "Growthloop", campaignId: "cmp-agency", accountId: "acc-omar", stage: "connected" },
  { id: "p-alex", tenantId: "northwind", firstName: "Alex", lastName: "Stein", title: "VP Finance", company: "Fintrail", campaignId: "cmp-cfo", accountId: "acc-james", stage: "messaged" },
  { id: "p-nora", tenantId: "brightlane", firstName: "Nora", lastName: "Weiss", title: "HR Director", company: "Talentic", campaignId: "cmp-hrtech", accountId: "acc-lina", stage: "queued" },
];

const STAGE_POOL: ProspectStage[] = ["new", "new", "queued", "queued", "invited", "invited", "invited", "connected", "connected", "messaged", "messaged", "replied", "not_interested"];

function build(): Prospect[] {
  const r = rng(2026);
  const out: Prospect[] = [];
  const listFor = (tenantId: string) => LISTS.filter((l) => l.tenantId === tenantId);

  for (const n of NAMED) {
    const list = listFor(n.tenantId)[0];
    out.push(finish({
      company: pick(COMPANIES, r),
      industry: pick(INDUSTRIES, r),
      location: pick(LOCATIONS, r),
      degree: 2,
      email: `${n.firstName.toLowerCase()}@${(n.company ?? "company").toLowerCase().replace(/[^a-z]/g, "")}.com`,
      icebreaker: pick(ICEBREAKERS, r),
      tags: ["priority"],
      addedAt: hoursAgo(24 * 12),
      lastTouchAt: hoursAgo(2 + r() * 20),
      listId: list?.id ?? "",
      ...n,
    } as Prospect));
  }

  const tenants = ["hq", "hq", "northwind", "northwind", "northwind", "brightlane", "brightlane"];
  for (let i = 0; i < 74; i++) {
    const tenantId = pick(tenants, r);
    const list = pick(listFor(tenantId), r);
    const tenantCampaigns = CAMPAIGNS.filter((c) => c.tenantId === tenantId && c.status !== "paused");
    const campaign = r() < 0.75 ? pick(tenantCampaigns, r) : undefined;
    const stage: ProspectStage = campaign ? pick(STAGE_POOL, r) : "new";
    const firstName = pick(FIRST_NAMES, r);
    const lastName = pick(LAST_NAMES, r);
    const company = pick(COMPANIES, r);
    out.push(finish({
      id: `p-${i + 1}`,
      tenantId,
      listId: list.id,
      campaignId: campaign?.id ?? null,
      accountId: campaign ? pick(campaign.accountIds, r) : null,
      firstName,
      lastName,
      title: pick(TITLES, r),
      company,
      industry: pick(INDUSTRIES, r),
      location: pick(LOCATIONS, r),
      degree: r() < 0.65 ? 2 : r() < 0.5 ? 3 : 1,
      stage,
      email: r() < 0.55 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, "")}.com` : null,
      icebreaker: pick(ICEBREAKERS, r),
      tags: r() < 0.3 ? ["hiring"] : r() < 0.2 ? ["funded"] : [],
      addedAt: hoursAgo(24 * (1 + Math.floor(r() * 25))),
      lastTouchAt: stage === "new" ? null : hoursAgo(1 + r() * 120),
      score: 0,
    }));
  }
  return out;
}

function finish(p: Prospect): Prospect {
  return { ...p, score: leadScore(p) };
}

export const PROSPECTS: Prospect[] = build();

export function prospectById(id: string) {
  return PROSPECTS.find((p) => p.id === id);
}

export function fullName(p: Pick<Prospect, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`;
}

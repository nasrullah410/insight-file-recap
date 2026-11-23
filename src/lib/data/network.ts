import { ACCOUNTS } from "../demo-data";
import { COMPANIES, FIRST_NAMES, hoursAgo, LAST_NAMES, LOCATIONS, pick, rng, TITLES } from "./seed";

export interface NetworkConnection {
  id: string;
  accountId: string;
  name: string;
  title: string;
  company: string;
  location: string;
  connectedAt: string;
  source: "campaign" | "organic";
  messaged: boolean;
}

function build(): NetworkConnection[] {
  const out: NetworkConnection[] = [];
  ACCOUNTS.forEach((a, ai) => {
    const r = rng(500 + ai);
    for (let i = 0; i < 18; i++) {
      out.push({
        id: `${a.id}-n${i}`,
        accountId: a.id,
        name: `${pick(FIRST_NAMES, r)} ${pick(LAST_NAMES, r)}`,
        title: pick(TITLES, r),
        company: pick(COMPANIES, r),
        location: pick(LOCATIONS, r),
        connectedAt: hoursAgo(i * 9 + r() * 8),
        source: r() < 0.7 ? "campaign" : "organic",
        messaged: r() < 0.55,
      });
    }
  });
  return out;
}

export const NETWORK: NetworkConnection[] = build();

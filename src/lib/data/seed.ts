import { NOW } from "../demo-data";

/** Deterministic pseudo-random generator so server and browser render the same sample data. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pick<T>(arr: readonly T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length) % arr.length] as T;
}

export const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
export const hoursAhead = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

export const FIRST_NAMES = ["Liam", "Noah", "Ava", "Mia", "Lucas", "Zara", "Hamza", "Sofia", "Elias", "Nadia", "Oliver", "Leah", "Ibrahim", "Chloe", "Mateo", "Hana", "Felix", "Priya", "Jonas", "Amira", "Ethan", "Yusuf", "Clara", "Rohan", "Isla", "Tobias", "Maya", "Bilal", "Freya", "Adam"] as const;
export const LAST_NAMES = ["Becker", "Ahmed", "Novak", "Fischer", "Patel", "Larsen", "Costa", "Khan", "Moreau", "Schmidt", "Brennan", "Iqbal", "Rossi", "Weber", "Hughes", "Nakamura", "Ortiz", "Shah", "Keller", "Dubois", "Murphy", "Rahman", "Lindqvist", "Vogel", "Carter", "Haddad"] as const;
export const COMPANIES = ["Ledgerly", "Northpeak Labs", "Fintrail", "Brightdesk", "Kindred HR", "Orbitly", "Payzen", "Cloudmint", "Stackhaus", "Talentic", "Growthloop", "Mercato AI", "Vaultline", "Peoplepath", "Quantly", "Shiftwise", "Brandforge", "Nimbus Ops", "Clearbook", "Hirebridge"] as const;
export const TITLES = ["Founder & CEO", "Co-founder", "CFO", "VP Finance", "Head of People", "HR Director", "Managing Director", "Agency Owner", "Head of Growth", "VP Sales", "COO", "Head of Talent", "Finance Director", "CTO", "Marketing Director"] as const;
export const INDUSTRIES = ["Fintech", "SaaS", "HR Tech", "Marketing Agency", "E-commerce", "Professional Services"] as const;
export const LOCATIONS = ["London, UK", "Berlin, DE", "Munich, DE", "Zurich, CH", "Amsterdam, NL", "New York, US", "Austin, US", "Dubai, AE", "Paris, FR", "Vienna, AT", "Manchester, UK", "San Francisco, US"] as const;

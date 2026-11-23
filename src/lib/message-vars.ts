/** Message variable rules shared by templates, SDR tasks and personalization review. */
export const VARIABLES = ["first_name", "last_name", "company", "job_title", "location", "industry", "icebreaker", "sender_name"] as const;
export type Variable = (typeof VARIABLES)[number];

export type VariableValues = Partial<Record<Variable, string | null>>;

const VAR_RE = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function variablesIn(body: string): string[] {
  return Array.from(new Set(Array.from(body.matchAll(VAR_RE), (m) => m[1] ?? "")));
}

/** Variables used in the body that have no value for this prospect — the message can't send as-is. */
export function missingVariables(body: string, values: VariableValues): string[] {
  return variablesIn(body).filter((v) => {
    const value = values[v as Variable];
    return value === undefined || value === null || value.trim() === "";
  });
}

export function renderMessage(body: string, values: VariableValues): string {
  return body.replace(VAR_RE, (whole, name: string) => {
    const value = values[name as Variable];
    return value && value.trim() ? value : whole;
  });
}

/** Split a body into text / variable chunks so the UI can highlight placeholders. */
export function tokenize(body: string): Array<{ text: string; variable: boolean }> {
  const out: Array<{ text: string; variable: boolean }> = [];
  let last = 0;
  for (const m of body.matchAll(VAR_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: body.slice(last, idx), variable: false });
    out.push({ text: m[0], variable: true });
    last = idx + m[0].length;
  }
  if (last < body.length) out.push({ text: body.slice(last), variable: false });
  return out;
}

/** LinkedIn's limit for a connection request note. */
export const INVITE_NOTE_LIMIT = 300;

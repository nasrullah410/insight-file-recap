import { useState } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TH } from "@/components/kit";

const FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "linkedin_url", label: "LinkedIn URL" },
  { key: "company", label: "Company" },
  { key: "job_title", label: "Job title" },
  { key: "email", label: "Email" },
  { key: "skip", label: "Don't import" },
] as const;

function guess(header: string): string {
  const h = header.toLowerCase().replace(/[^a-z]/g, "");
  if (h.includes("first")) return "first_name";
  if (h.includes("last")) return "last_name";
  if (h.includes("linkedin") || h.includes("url") || h.includes("profile")) return "linkedin_url";
  if (h.includes("company") || h.includes("organization")) return "company";
  if (h.includes("title") || h.includes("position")) return "job_title";
  if (h.includes("mail")) return "email";
  return "skip";
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
}

export function ImportDialog({ open, onOpenChange, listName }: { open: boolean; onOpenChange: (o: boolean) => void; listName: string }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<string[]>([]);
  const headers = rows[0] ?? [];
  const body = rows.slice(1);

  const reset = () => {
    setRows([]);
    setMapping([]);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseCsv(await file.text());
    setRows(parsed);
    setMapping((parsed[0] ?? []).map(guess));
  };

  const hasUrl = mapping.includes("linkedin_url");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import prospects from CSV</DialogTitle>
          <DialogDescription>Adds to “{listName}”. Existing prospects with the same LinkedIn URL are updated.</DialogDescription>
        </DialogHeader>
        {rows.length === 0 ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong p-10 text-center hover:bg-accent/30">
            <FileUp className="size-6 text-subtle-foreground" />
            <span className="text-[13px] font-medium">Choose a CSV file</span>
            <span className="text-[12px] text-muted-foreground">First row should be column names. A LinkedIn URL column is required.</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {headers.map((h, i) => (
                <div key={`${h}-${i}`} className="space-y-1">
                  <Label className="text-[12px] text-muted-foreground">Column “{h}”</Label>
                  <Select value={mapping[i] ?? "skip"} onValueChange={(v) => setMapping((m) => m.map((x, j) => (j === i ? v : x)))}>
                    <SelectTrigger className="h-8 text-[13px]" aria-label={`Map column ${h}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIELDS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="max-h-48 overflow-auto rounded-md border border-border">
              <table className="w-full text-[12px]">
                <thead><tr>{headers.map((h, i) => <th key={i} className={TH}>{FIELDS.find((f) => f.key === mapping[i])?.label ?? h}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {body.slice(0, 5).map((r, i) => (
                    <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap">{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!hasUrl && <p className="text-[12px] text-destructive">Map one column to LinkedIn URL to continue.</p>}
          </div>
        )}
        <DialogFooter>
          {rows.length > 0 && <Button variant="soft" size="sm" onClick={reset}>Choose another file</Button>}
          <Button
            size="sm"
            disabled={!hasUrl || body.length === 0}
            onClick={() => {
              toast.success(`${body.length} prospects imported to “${listName}”`);
              reset();
              onOpenChange(false);
            }}
          >
            Import {body.length > 0 ? body.length : ""} prospects
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { getLocalClock, isWithinWorkingHours } from "@/lib/account-health";
import type { AccountView } from "@/lib/workspace";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function workingState(account: AccountView, now: Date) {
  const clock = getLocalClock(account.timezone, now);
  const within = isWithinWorkingHours(account, now);
  const startLabel = `${String(account.workingHours.start).padStart(2, "0")}:00`;
  const endLabel = `${String(account.workingHours.end).padStart(2, "0")}:00`;

  let label: string;
  let tone: "success" | "muted" | "danger" | "info";
  if (account.status === "disconnected") {
    label = "Not sending";
    tone = "danger";
  } else if (account.status === "limited") {
    label = within ? "Waiting for limit reset" : "Off hours";
    tone = "info";
  } else if (within) {
    label = "Sending now";
    tone = "success";
  } else {
    // next working day
    let next = clock.weekday;
    const laterToday = account.workingHours.days.includes(clock.weekday) && clock.hour < account.workingHours.start;
    if (!laterToday) {
      for (let i = 1; i <= 7; i++) {
        const d = ((clock.weekday - 1 + i) % 7) + 1;
        if (account.workingHours.days.includes(d)) {
          next = d;
          break;
        }
      }
    }
    label = `Off hours · resumes ${laterToday ? "" : `${DAY_NAMES[next]} `}${startLabel}`;
    tone = "muted";
  }

  const days = account.workingHours.days;
  const dayRange = days.length > 0 ? `${DAY_NAMES[days[0] ?? 1]}–${DAY_NAMES[days[days.length - 1] ?? 5]}` : "No days";

  return { clock, within, label, tone, schedule: `${dayRange}, ${startLabel}–${endLabel}` };
}

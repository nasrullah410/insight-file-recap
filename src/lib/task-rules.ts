/** SDR task ordering rules. */
export interface TaskLike {
  status: "pending_approval" | "completed" | "skipped";
  priority: "high" | "normal";
  dueAt: string;
}

export function isOverdue(task: TaskLike, now: Date): boolean {
  return task.status === "pending_approval" && new Date(task.dueAt).getTime() < now.getTime();
}

/** Overdue first, then high priority, then soonest due. Finished tasks go last. */
export function sortTasks<T extends TaskLike>(tasks: T[], now: Date): T[] {
  const rank = (t: T) => (t.status !== "pending_approval" ? 3 : isOverdue(t, now) ? 0 : t.priority === "high" ? 1 : 2);
  return [...tasks].sort((a, b) => rank(a) - rank(b) || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

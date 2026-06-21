export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${h}:${mi}`;
}

export function daysBetween(from: Date | string, to: Date | string): number {
  const f = typeof from === "string" ? new Date(from) : new Date(from);
  const t = typeof to === "string" ? new Date(to) : new Date(to);
  f.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

export function today(): string {
  return formatDate(new Date());
}

export function daysFromToday(target: string): number {
  return daysBetween(new Date(), target);
}

export function cyclePercentage(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
}

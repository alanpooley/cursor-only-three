export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatTodayDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatHistoryDate(dateKey: string): string {
  const todayKey = formatDateKey(new Date());
  if (dateKey === todayKey) return "Today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);
  if (dateKey === yesterdayKey) return "Yesterday";

  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function getTomorrowDateKey(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateKey(tomorrow);
}

export function isSameDateKey(left: string, right: string): boolean {
  return left === right;
}

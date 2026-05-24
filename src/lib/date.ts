const TIMEZONE = "Asia/Jakarta";

export function formatDateJakarta(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function todayDate(): string {
  return formatDateJakarta(new Date());
}

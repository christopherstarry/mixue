const TIMEZONE = "Asia/Jakarta";

export function todayDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export function nowInTimezone(): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: TIMEZONE });
  return new Date(str);
}

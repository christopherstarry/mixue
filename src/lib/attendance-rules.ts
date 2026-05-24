const TIMEZONE = "Asia/Jakarta";

const TOLERANCE_SECONDS = 15 * 60;
const ABSENT_AFTER_SECONDS = 30 * 60;

const MORNING_START_SECONDS = 9 * 3600;
const MORNING_LATE_END_SECONDS = MORNING_START_SECONDS + ABSENT_AFTER_SECONDS; // 09:30:00
const MORNING_ABSENT_AT_SECONDS = MORNING_START_SECONDS + ABSENT_AFTER_SECONDS + 1; // 09:30:01
const WEEKDAY_AFTERNOON_START_SECONDS = 14 * 3600;
const WEEKEND_EARLY_START_SECONDS = 14 * 3600;
const WEEKEND_AFTERNOON_START_SECONDS = 15 * 3600;

export type AttendanceStatus = "on_time" | "late" | "absent";
export type PayStatus = "full_day" | "half_day" | "unpaid";

export interface AttendanceEvaluation {
  scheduledStartAt: Date;
  latenessSeconds: number;
  attendanceStatus: AttendanceStatus;
  payStatus: PayStatus;
}

function jakartaDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isWeekendInJakarta(date: Date): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(date);
  return weekday === "Sat" || weekday === "Sun";
}

function jakartaTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    hours: get("hour"),
    minutes: get("minute"),
    seconds: get("second"),
  };
}

function jakartaDateTime(dateStr: string, hour: number, minute: number, second: number): Date {
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  const s = String(second).padStart(2, "0");
  return new Date(`${dateStr}T${h}:${m}:${s}+07:00`);
}

function secondsSinceMidnight(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

function evaluateLateness(clockInAt: Date, scheduledStartAt: Date): AttendanceEvaluation {
  const latenessSeconds = Math.max(
    0,
    Math.floor((clockInAt.getTime() - scheduledStartAt.getTime()) / 1000)
  );

  let attendanceStatus: AttendanceStatus = "on_time";
  let payStatus: PayStatus = "full_day";

  if (latenessSeconds > ABSENT_AFTER_SECONDS) {
    attendanceStatus = "absent";
    payStatus = "unpaid";
  } else if (latenessSeconds > TOLERANCE_SECONDS) {
    attendanceStatus = "late";
    payStatus = "half_day";
  }

  return {
    scheduledStartAt,
    latenessSeconds,
    attendanceStatus,
    payStatus,
  };
}

function selectScheduledStart(clockInAt: Date, weekend: boolean): Date {
  const dateStr = jakartaDateString(clockInAt);
  const { hours, minutes, seconds } = jakartaTimeParts(clockInAt);
  const clockInSeconds = secondsSinceMidnight(hours, minutes, seconds);

  // Morning window: evaluate against 09:00 through 09:30:00 (late) and 09:30:01 (absent)
  if (
    clockInSeconds <= MORNING_LATE_END_SECONDS ||
    clockInSeconds === MORNING_ABSENT_AT_SECONDS
  ) {
    return jakartaDateTime(dateStr, 9, 0, 0);
  }

  const afternoonStartSeconds = weekend
    ? WEEKEND_AFTERNOON_START_SECONDS
    : WEEKDAY_AFTERNOON_START_SECONDS;

  // Weekend: 14:00 through 15:15:00 is early/on-time for the 15:00 window
  if (
    weekend &&
    clockInSeconds >= WEEKEND_EARLY_START_SECONDS &&
    clockInSeconds < afternoonStartSeconds
  ) {
    return jakartaDateTime(dateStr, 15, 0, 0);
  }

  // Weekday: between morning absent cutoff and 14:00 is early for the 14:00 window
  if (
    !weekend &&
    clockInSeconds > MORNING_ABSENT_AT_SECONDS &&
    clockInSeconds < WEEKDAY_AFTERNOON_START_SECONDS
  ) {
    return jakartaDateTime(dateStr, 14, 0, 0);
  }

  // At or after the afternoon start
  return jakartaDateTime(
    dateStr,
    weekend ? 15 : 14,
    0,
    0
  );
}

export function evaluateAttendance(clockInAt: Date): AttendanceEvaluation {
  const weekend = isWeekendInJakarta(clockInAt);
  const scheduledStartAt = selectScheduledStart(clockInAt, weekend);
  return evaluateLateness(clockInAt, scheduledStartAt);
}

export function formatJakartaTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatJakartaDateWithDay(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatDuration(inAt: Date | string, outAt: Date | string | null): string {
  if (!outAt) return "-";
  const t1 = new Date(inAt).getTime();
  const t2 = new Date(outAt).getTime();
  if (isNaN(t1) || isNaN(t2) || t2 < t1) return "-";

  const totalSeconds = Math.floor((t2 - t1) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hours}h ${minutes}m ${String(secs).padStart(2, "0")}s`;
}

export function formatLateness(seconds: number): string {
  if (seconds <= 0) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${String(secs).padStart(2, "0")}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(secs).padStart(2, "0")}s`;
  }
  return `${secs}s`;
}

export function formatScheduledStart(scheduledStartAt: Date | string): string {
  return formatJakartaTime(scheduledStartAt);
}

export function statusLabel(status: AttendanceStatus): string {
  switch (status) {
    case "on_time":
      return "On time";
    case "late":
      return "Late";
    case "absent":
      return "Absent";
  }
}

export function payLabel(payStatus: PayStatus): string {
  switch (payStatus) {
    case "full_day":
      return "Full day";
    case "half_day":
      return "Half day";
    case "unpaid":
      return "Unpaid";
  }
}

export function resolveAttendanceFields(attendance: {
  clockInAt: Date | string;
}): AttendanceEvaluation {
  return evaluateAttendance(new Date(attendance.clockInAt));
}

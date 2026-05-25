export interface PayrollPeriod {
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
}

export function getPayrollPeriod(date: Date): PayrollPeriod {
  const day = date.getDate();
  let startYear: number, startMonth: number, endYear: number, endMonth: number;

  if (day >= 28) {
    startMonth = date.getMonth();
    startYear = date.getFullYear();
    const end = new Date(startYear, startMonth + 1, 27);
    endMonth = end.getMonth();
    endYear = end.getFullYear();
  } else {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 28);
    startMonth = start.getMonth();
    startYear = start.getFullYear();
    endMonth = date.getMonth();
    endYear = date.getFullYear();
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    start: `${startYear}-${pad(startMonth + 1)}-28`,
    end: `${endYear}-${pad(endMonth + 1)}-27`,
    startLabel: `${pad(startMonth + 1)}/${startYear}`,
    endLabel: `${pad(endMonth + 1)}/${endYear}`,
  };
}

export function getDaysInPeriod(start: string, end: string): string[] {
  const days: string[] = [];
  const current = new Date(start + "T00:00:00+07:00");
  const endDate = new Date(end + "T00:00:00+07:00");

  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function formatPeriodLabel(start: string, end: string): string {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00+07:00");
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export function getPastDaysInPeriod(start: string, end: string): string[] {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return getDaysInPeriod(start, end).filter((d) => d <= todayStr);
}

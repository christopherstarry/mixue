"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPayrollPeriod,
  getPastDaysInPeriod,
  formatPeriodLabel,
} from "@/lib/payroll-period";
import {
  formatJakartaDateWithDay,
  formatJakartaTime,
  formatDuration,
  formatLateness,
  formatScheduledStart,
  statusLabel,
  payLabel,
  type AttendanceStatus,
  type PayStatus,
} from "@/lib/attendance-rules";

interface Worker {
  id: number;
  name: string;
}

interface Attendance {
  id: number;
  workerId: number;
  date: string;
  clockInAt: string;
  clockOutAt: string | null;
  scheduledStartAt: string;
  latenessSeconds: number;
  attendanceStatus: AttendanceStatus;
  payStatus: PayStatus;
  worker: { id: number; name: string };
}

interface WorkerSummary {
  workerId: number;
  workerName: string;
  onTime: number;
  late: number;
  absent: number;
  totalPresent: number;
}

function statusBadgeClass(status: AttendanceStatus): string {
  switch (status) {
    case "on_time": return "bg-green-100 text-green-700";
    case "late": return "bg-yellow-100 text-yellow-800";
    case "absent": return "bg-red-100 text-red-700";
  }
}

export default function AdminReportPage() {
  const router = useRouter();
  const now = new Date();
  const [period, setPeriod] = useState(getPayrollPeriod(now));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<WorkerSummary[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/attendance?startDate=${period.start}&endDate=${period.end}`
      );
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setAttendances(data.attendances);

      const totalDays = getPastDaysInPeriod(period.start, period.end).length;
      const grouped: Record<number, WorkerSummary> = {};

      for (const a of data.attendances) {
        if (!grouped[a.workerId]) {
          grouped[a.workerId] = {
            workerId: a.worker.id,
            workerName: a.worker.name,
            onTime: 0,
            late: 0,
            absent: 0,
            totalPresent: 0,
          };
        }
        if (a.attendanceStatus === "on_time") grouped[a.workerId].onTime++;
        else if (a.attendanceStatus === "late") grouped[a.workerId].late++;
        grouped[a.workerId].totalPresent++;
      }

      for (const w of data.workers) {
        if (!grouped[w.id]) {
          grouped[w.id] = {
            workerId: w.id,
            workerName: w.name,
            onTime: 0,
            late: 0,
            absent: 0,
            totalPresent: 0,
          };
        }
      }

      for (const key of Object.keys(grouped)) {
        const s = grouped[Number(key)];
        const workerDays = data.attendances.filter(
          (a: Attendance) => a.workerId === s.workerId
        ).length;
        s.absent = totalDays - workerDays;
      }

      setSummaries(Object.values(grouped).sort((a, b) => a.workerName.localeCompare(b.workerName)));
    } catch (e) {
      console.error("Report error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSubmit = () => {
    const m = parseInt(month) - 1;
    const y = parseInt(year);
    const refDate = m === 0 ? new Date(y - 1, 11, 28) : new Date(y, m, Math.min(28, new Date(y, m + 1, 0).getDate()));
    setPeriod(getPayrollPeriod(refDate));
    setLoading(true);
    window.setTimeout(() => fetchReport(), 0);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-orange-600">Mixue</h1>
          <p className="text-sm text-gray-500">Payroll Report</p>
        </div>
        <div className="flex gap-3 items-center">
          <a href="/admin/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
            Dashboard
          </a>
          <a href="/admin/workers" className="text-sm text-blue-600 hover:text-blue-800">
            Manage Workers
          </a>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">
            Logout
          </button>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="text-sm text-gray-700 font-medium mb-3">
            Period: {formatPeriodLabel(period.start, period.end)}
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Start Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {new Date(0, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handlePeriodSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Show Report
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No data for this period.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">Worker</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">On Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">Late</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">Absent</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">Total Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaries.map((s) => (
                  <tr key={s.workerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setExpandedWorker(
                            expandedWorker === s.workerId ? null : s.workerId
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                      >
                        {s.workerName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {s.onTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {s.late}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {s.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {s.onTime + s.late + s.absent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {expandedWorker && (
              <div className="border-t border-gray-200">
                <div className="p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {summaries.find((s) => s.workerId === expandedWorker)?.workerName} — Daily Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Schedule</th>
                          <th className="px-3 py-2">Clock In</th>
                          <th className="px-3 py-2">Clock Out</th>
                          <th className="px-3 py-2">Hours</th>
                          <th className="px-3 py-2">Late</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                        {attendances
                          .filter((a) => a.workerId === expandedWorker)
                          .map((a) => (
                            <tr key={a.id} className="hover:bg-white">
                              <td className="px-3 py-2 whitespace-nowrap">
                                {formatJakartaDateWithDay(a.date)}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {formatScheduledStart(a.scheduledStartAt)}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {formatJakartaTime(a.clockInAt)}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {a.clockOutAt ? formatJakartaTime(a.clockOutAt) : "-"}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {formatDuration(a.clockInAt, a.clockOutAt)}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {formatLateness(a.latenessSeconds)}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(a.attendanceStatus)}`}>
                                  {statusLabel(a.attendanceStatus)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

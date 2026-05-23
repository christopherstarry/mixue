"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Worker {
  id: number;
  name: string;
  phone: string;
}

interface Attendance {
  id: number;
  workerId: number;
  date: string;
  clockInAt: string;
  clockInPhoto: string;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutAt: string | null;
  clockOutPhoto: string | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  worker: { id: number; name: string; username: string };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [workerId, setWorkerId] = useState("all");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/attendance?month=${month}&year=${year}&workerId=${workerId}`
      );
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setAttendances(data.attendances);
      setWorkers(data.workers);
    } catch {
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const formatDateTime = (dt: string) => {
    return new Date(dt).toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dt: string) => {
    return new Date(dt + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const calcHours = (inAt: string, outAt: string | null) => {
    if (!outAt) return "-";
    const diff = new Date(outAt).getTime() - new Date(inAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-orange-600">Mixue</h1>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        <div className="flex gap-3 items-center">
          <a
            href="/admin/workers"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Manage Workers
          </a>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Month</label>
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
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Worker</label>
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
              >
                <option value="all">All Workers</option>
                {workers.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchAttendance}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : attendances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No attendance records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Worker</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Clock In</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Photo In</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Clock Out</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Photo Out</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Hours</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-700">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 text-sm text-gray-800">
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(a.date)}</td>
                    <td className="px-3 py-3 font-medium">{a.worker.name}</td>
                    <td className="px-3 py-3">{formatDateTime(a.clockInAt)}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() =>
                          setExpandedPhoto(
                            expandedPhoto === a.clockInPhoto ? null : a.clockInPhoto
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      {a.clockOutAt ? formatDateTime(a.clockOutAt) : "-"}
                    </td>
                    <td className="px-3 py-3">
                      {a.clockOutPhoto ? (
                        <button
                          onClick={() =>
                            setExpandedPhoto(
                              expandedPhoto === a.clockOutPhoto ? null : a.clockOutPhoto
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          View
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-3">{calcHours(a.clockInAt, a.clockOutAt)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {a.clockInLat && a.clockInLng ? (
                        <a
                          href={`geo:${a.clockInLat},${a.clockInLng}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {a.clockInLat.toFixed(4)}, {a.clockInLng.toFixed(4)}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {expandedPhoto && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setExpandedPhoto(null)}
          >
            <img
              src={expandedPhoto}
              alt="Attendance photo"
              className="max-w-full max-h-full rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Worker {
  id: number;
  name: string;
  username: string;
  isActive: boolean;
  weeklyDayOffs: number;
  createdAt: string;
}

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [weeklyDayOffs, setWeeklyDayOffs] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await fetch("/api/admin/workers");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setWorkers(data.workers);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setName("");
    setUsername("");
    setPassword("");
    setWeeklyDayOffs(1);
    setError("");
    setShowForm(true);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setName(w.name);
    setUsername(w.username);
    setPassword("");
    setWeeklyDayOffs(w.weeklyDayOffs);
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const method = editing ? "PUT" : "POST";
      const body: any = { name, username, weeklyDayOffs };
      if (editing) {
        body.id = editing.id;
        if (password) body.password = password;
      } else {
        body.password = password;
      }

      const res = await fetch("/api/admin/workers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        fetchWorkers();
      } else {
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (w: Worker) => {
    await fetch("/api/admin/workers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: w.id, isActive: !w.isActive }),
    });
    fetchWorkers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this worker and all their attendance records?")) return;
    await fetch(`/api/admin/workers?id=${id}`, { method: "DELETE" });
    fetchWorkers();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-orange-600">Mixue</h1>
          <p className="text-sm text-gray-500">Worker Management</p>
        </div>
        <div className="flex gap-3 items-center">
          <a
            href="/admin/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Dashboard
          </a>
          <button
            onClick={() => router.push("/admin/login")}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Workers</h2>
          <button
            onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add Worker
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editing ? "Edit Worker" : "Add Worker"}
              </h3>
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 bg-white"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 bg-white"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editing && "(leave blank to keep current)"}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 bg-white"
                    required={!editing}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day offs per week
                  </label>
                  <select
                    value={weeklyDayOffs}
                    onChange={(e) => setWeeklyDayOffs(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 bg-white"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                {error && (
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-xl font-medium transition"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : workers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No workers yet. Add your first worker.
          </div>
        ) : (
          <div className="space-y-2">
            {workers.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className={`font-medium ${w.isActive ? "text-gray-800" : "text-gray-400 line-through"}`}>
                    {w.name}
                  </p>
                  <p className="text-sm text-gray-500">@{w.username} &middot; {w.weeklyDayOffs} day(s) off/week</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => toggleActive(w)}
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      w.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {w.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => openEdit(w)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

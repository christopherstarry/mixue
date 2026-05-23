"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Worker {
  id: number;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
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
    setPhone("");
    setPin("");
    setError("");
    setShowForm(true);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setName(w.name);
    setPhone(w.phone);
    setPin("");
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const method = editing ? "PUT" : "POST";
      const body: any = { name, phone };
      if (editing) {
        body.id = editing.id;
        if (pin) body.pin = pin;
      } else {
        body.pin = pin;
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
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Dashboard
          </a>
          <button
            onClick={() => router.push("/admin/login")}
            className="text-sm text-gray-400 hover:text-red-500"
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
              <h3 className="text-lg font-semibold mb-4">
                {editing ? "Edit Worker" : "Add Worker"}
              </h3>
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN {editing && "(leave blank to keep current)"}
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    maxLength={6}
                    required={!editing}
                  />
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
          <div className="text-center py-8 text-gray-400">
            No workers yet. Add your first worker.
          </div>
        ) : (
          <div className="space-y-2">
            {workers.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className={`font-medium ${w.isActive ? "text-gray-800" : "text-gray-400 line-through"}`}>
                    {w.name}
                  </p>
                  <p className="text-sm text-gray-500">{w.phone}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => toggleActive(w)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      w.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {w.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => openEdit(w)}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-sm text-red-500 hover:text-red-700"
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

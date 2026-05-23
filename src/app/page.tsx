"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkerLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/worker/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/clock");
      } else {
        const data = await res.json();
        setError(data.error || "Username atau password salah");
      }
    } catch {
      setError("Gagal terhubung. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🍦</div>
          <h1 className="text-2xl font-bold text-orange-600">Mixue</h1>
          <p className="text-gray-500 text-sm mt-1">Absensi Karyawan</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 bg-white"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 bg-white"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="text-center mt-4">
          <a
            href="/admin/login"
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Admin
          </a>
        </div>
      </div>
    </div>
  );
}

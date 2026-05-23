"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkerLoginPage() {
  const [pin, setPin] = useState("");
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
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/clock");
      } else {
        setError(data.error || "Invalid PIN");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) setPin((prev) => prev + num);
    setError("");
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-orange-600">Mixue</h1>
          <p className="text-gray-500 text-sm mt-1">Attendance</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 text-center mb-3">
              Enter your PIN
            </label>
            <div className="flex justify-center gap-2 mb-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-orange-400 flex items-center justify-center"
                >
                  {pin[i] && (
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberPress(num)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-semibold py-4 rounded-xl transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-50 hover:bg-red-100 text-red-500 text-lg py-4 rounded-xl transition"
            >
              DEL
            </button>
            <button
              type="button"
              onClick={() => handleNumberPress("0")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-semibold py-4 rounded-xl transition"
            >
              0
            </button>
            <button
              type="submit"
              disabled={pin.length < 4 || loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-lg font-semibold py-4 rounded-xl transition"
            >
              {loading ? "..." : "OK"}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <a
            href="/admin/login"
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClockPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasOpenClockIn, setHasOpenClockIn] = useState<boolean | null>(null);
  const [clockInAt, setClockInAt] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState<"idle" | "live" | "captured">("idle");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [clockTime, setClockTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkStatus();
    getLocation();
    return () => stopCamera();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/clock/status");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setHasOpenClockIn(data.hasOpenClockIn);
      setWorkerName(data.workerName);
      if (data.clockInAt) {
        setClockInAt(new Date(data.clockInAt).toLocaleTimeString());
      }
    } catch {
      router.push("/");
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setCameraMode("live");
    } catch {
      // fallback to file input if camera not available
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setPhotoFile(file);
      setPhotoData(URL.createObjectURL(blob));
      setCameraMode("captured");
      stopCamera();
    }, "image/jpeg", 0.8);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const retakePhoto = () => {
    setPhotoData(null);
    setPhotoFile(null);
    setCameraMode("idle");
    openCamera();
  };

  const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoData(URL.createObjectURL(file));
    setCameraMode("captured");
  };

  const handleClockAction = async (action: "in" | "out") => {
    if (!photoFile) {
      setMessage({ type: "error", text: "Harap foto selfie terlebih dahulu" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      if (location) {
        formData.append("lat", String(location.lat));
        formData.append("lng", String(location.lng));
      }

      const res = await fetch(`/api/clock/${action}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setPhotoData(null);
        setPhotoFile(null);
        setCameraMode("idle");
        setTimeout(() => checkStatus(), 500);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal terhubung" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    stopCamera();
    await fetch("/api/worker/logout", { method: "POST" });
    router.push("/");
  };

  if (hasOpenClockIn === null) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileFallback}
      />
      <canvas ref={canvasRef} className="hidden" />

      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍦</span>
            <h1 className="text-lg font-bold text-orange-600">Mixue</h1>
          </div>
          <p className="text-sm text-gray-500">Halo, {workerName}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500">
          Keluar
        </button>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center">
        <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm mb-4 text-center">
          <p className="text-4xl font-mono font-bold text-gray-800">{clockTime}</p>
          {clockInAt && (
            <p className="text-sm text-gray-400 mt-1">
              Masuk jam {clockInAt}
            </p>
          )}
        </div>

        {message && (
          <div
            className={`w-full max-w-sm p-3 rounded-xl mb-4 text-center text-sm font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3 text-center">
            {cameraMode === "idle" && "Ambil foto selfie"}
            {cameraMode === "live" && "Arahkan ke wajah lalu tekan tombol"}
            {cameraMode === "captured" && "Foto sudah diambil"}
          </h2>

          <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
            {cameraMode === "live" && (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}
            {cameraMode === "captured" && photoData && (
              <img src={photoData} alt="Selfie" className="w-full h-full object-cover" />
            )}
            {cameraMode === "idle" && (
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>

          {cameraMode === "idle" && (
            <button
              onClick={openCamera}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition"
            >
              Buka Kamera
            </button>
          )}
          {cameraMode === "live" && (
            <button
              onClick={capturePhoto}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition"
            >
              Ambil Foto
            </button>
          )}
          {cameraMode === "captured" && (
            <button
              onClick={retakePhoto}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-xl font-medium transition text-sm"
            >
              Foto Ulang
            </button>
          )}
        </div>

        {location && (
          <p className="text-xs text-gray-400 mb-4">
            Lokasi: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}

        <div className="w-full max-w-sm flex gap-3">
          <button
            onClick={() => handleClockAction("in")}
            disabled={cameraMode !== "captured" || loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            {loading ? "..." : "Absen Masuk"}
          </button>
          <button
            onClick={() => handleClockAction("out")}
            disabled={cameraMode !== "captured" || loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            {loading ? "..." : "Absen Pulang"}
          </button>
        </div>
      </main>
    </div>
  );
}

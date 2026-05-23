"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClockPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
  const [clockInAt, setClockInAt] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
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
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/clock/status");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setIsClockedIn(data.isClockedIn);
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

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setCameraActive(true);
      setPhoto(null);
    } catch {
      setMessage({ type: "error", text: "Camera access denied. Please allow camera permission." });
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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhoto(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(",");
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleClockAction = async (action: "in" | "out") => {
    if (!photo) {
      setMessage({ type: "error", text: "Please take a photo first" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("photo", dataUrlToBlob(photo), "photo.jpg");
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
        setPhoto(null);
        setTimeout(() => checkStatus(), 500);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Connection error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/worker/logout", { method: "POST" });
    router.push("/");
  };

  if (isClockedIn === null) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-orange-600">Mixue</h1>
          <p className="text-sm text-gray-500">Welcome, {workerName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-500"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center">
        <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm mb-4 text-center">
          <p className="text-4xl font-mono font-bold text-gray-800">{clockTime}</p>
          <p className="text-sm text-gray-400 mt-1">
            {isClockedIn ? `Clocked in at ${clockInAt}` : "Not clocked in"}
          </p>
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
            {photo ? "Photo captured" : cameraActive ? "Position your face" : "Take a photo"}
          </h2>

          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
            {photo ? (
              <img src={photo} alt="Captured" className="w-full h-full object-cover" />
            ) : cameraActive ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                No photo
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {!photo && !cameraActive && (
            <button
              onClick={startCamera}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition"
            >
              Open Camera
            </button>
          )}

          {cameraActive && (
            <button
              onClick={capturePhoto}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition"
            >
              Capture Photo
            </button>
          )}

          {photo && (
            <button
              onClick={retakePhoto}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-xl font-medium transition text-sm mb-2"
            >
              Retake
            </button>
          )}
        </div>

        {location && (
          <p className="text-xs text-gray-400 mb-4">
            Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}

        {isClockedIn ? (
          <button
            onClick={() => handleClockAction("out")}
            disabled={!photo || loading}
            className="w-full max-w-sm bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            {loading ? "Processing..." : "Clock Out"}
          </button>
        ) : (
          <button
            onClick={() => handleClockAction("in")}
            disabled={!photo || loading}
            className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            {loading ? "Processing..." : "Clock In"}
          </button>
        )}
      </main>
    </div>
  );
}

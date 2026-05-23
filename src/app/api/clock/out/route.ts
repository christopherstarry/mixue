import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAuthenticatedWorker } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const prisma = await getPrisma();
    const worker = await getAuthenticatedWorker();
    if (!worker) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const attendance = await prisma.attendance.findFirst({
      where: { workerId: worker.id, clockOutAt: null },
      orderBy: { clockInAt: "desc" },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Belum ada absen masuk. Silakan absen masuk dulu." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const photo = formData.get("photo") as File;
    const timestamp = formData.get("timestamp") as string;
    const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null;
    const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null;

    if (!photo) {
      return NextResponse.json({ error: "Foto wajib diambil" }, { status: 400 });
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = photo.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOutAt: timestamp ? new Date(timestamp) : new Date(),
        clockOutPhoto: dataUrl,
        clockOutLat: lat,
        clockOutLng: lng,
      },
    });

    return NextResponse.json({ success: true, message: "Absen pulang berhasil" });
  } catch (error) {
    console.error("Clock out error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAuthenticatedWorker } from "@/lib/auth";
import { todayDate, nowInTimezone } from "@/lib/date";

export async function POST(req: Request) {
  try {
    const prisma = await getPrisma();
    const worker = await getAuthenticatedWorker();
    if (!worker) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const today = todayDate();

    const alreadyDone = await prisma.attendance.findFirst({
      where: { workerId: worker.id, date: today, clockOutAt: { not: null } },
    });

    if (alreadyDone) {
      return NextResponse.json(
        { error: "Kamu sudah absen masuk dan pulang hari ini." },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findFirst({
      where: { workerId: worker.id, clockOutAt: null },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Kamu sudah absen masuk pada ${existing.date} dan belum absen pulang. Silakan absen pulang dulu.`,
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const photo = formData.get("photo") as File;
    const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null;
    const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null;

    if (!photo) {
      return NextResponse.json({ error: "Foto wajib diambil" }, { status: 400 });
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = photo.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    await prisma.attendance.create({
      data: {
        workerId: worker.id,
        date: today,
        clockInPhoto: dataUrl,
        clockInLat: lat,
        clockInLng: lng,
        clockInAt: nowInTimezone(),
      },
    });

    return NextResponse.json({ success: true, message: "Absen masuk berhasil" });
  } catch (error) {
    console.error("Clock in error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

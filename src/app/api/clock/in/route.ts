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

    const today = new Date().toISOString().split("T")[0];

    const existing = await prisma.attendance.findFirst({
      where: { workerId: worker.id, clockOutAt: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: `You already clocked in on ${existing.date} and haven't clocked out. Please clock out first.` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const photo = formData.get("photo") as File;
    const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null;
    const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null;

    if (!photo) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
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
        clockInAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Clocked in successfully" });
  } catch (error) {
    console.error("Clock in error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

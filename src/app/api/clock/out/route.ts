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

    const attendance = await prisma.attendance.findFirst({
      where: { workerId: worker.id, date: today, clockOutAt: null },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "No active clock-in found. Please clock in first." },
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
    const filename = `clock_out_${worker.id}_${Date.now()}.jpg`;

    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOutAt: new Date(),
        clockOutPhoto: `/uploads/${filename}`,
        clockOutLat: lat,
        clockOutLng: lng,
      },
    });

    return NextResponse.json({ success: true, message: "Clocked out successfully" });
  } catch (error) {
    console.error("Clock out error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

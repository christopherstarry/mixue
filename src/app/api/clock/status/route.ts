import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAuthenticatedWorker } from "@/lib/auth";

export async function GET() {
  try {
    const prisma = await getPrisma();
    const worker = await getAuthenticatedWorker();
    if (!worker) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    const active = await prisma.attendance.findFirst({
      where: { workerId: worker.id, date: today, clockOutAt: null },
    });

    return NextResponse.json({
      isClockedIn: !!active,
      clockInAt: active?.clockInAt || null,
      workerName: worker.name,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

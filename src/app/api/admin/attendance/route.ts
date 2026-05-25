import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { resolveAttendanceFields } from "@/lib/attendance-rules";

export async function GET(req: Request) {
  try {
    const prisma = await getPrisma();
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const workerId = searchParams.get("workerId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: string, endDate: string;

    if (startDateParam && endDateParam) {
      startDate = startDateParam;
      endDate = endDateParam;
    } else {
      if (!month || !year) {
        return NextResponse.json(
          { error: "Month and year are required" },
          { status: 400 }
        );
      }

      const m = parseInt(month);
      const y = parseInt(year);
      startDate = `${y}-${String(m).padStart(2, "0")}-01`;

      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }

    const where: {
      date: { gte: string; lte: string };
      workerId?: number;
    } = {
      date: { gte: startDate, lte: endDate },
    };

    if (workerId && workerId !== "all") {
      where.workerId = parseInt(workerId);
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { worker: { select: { id: true, name: true, username: true } } },
      orderBy: [{ date: "desc" }, { clockInAt: "desc" }],
    });

    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const enriched = attendances.map((a) => {
      const fields = resolveAttendanceFields(a);
      return {
        ...a,
        scheduledStartAt: fields.scheduledStartAt.toISOString(),
        latenessSeconds: fields.latenessSeconds,
        attendanceStatus: fields.attendanceStatus,
        payStatus: fields.payStatus,
      };
    });

    return NextResponse.json({ attendances: enriched, workers });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

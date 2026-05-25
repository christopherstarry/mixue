import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAdminSession, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const prisma = await getPrisma();
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workers = await prisma.worker.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ workers });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const prisma = await getPrisma();
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, username, password, weeklyDayOffs } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Name, username, and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.worker.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);

    const worker = await prisma.worker.create({
      data: {
        name,
        username,
        password: hashed,
        weeklyDayOffs: weeklyDayOffs !== undefined ? weeklyDayOffs : 1,
      },
    });

    return NextResponse.json({ success: true, worker });
  } catch (e) {
    console.error("Add worker error:", e);
    return NextResponse.json({ error: "Gagal menambahkan worker" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const prisma = await getPrisma();
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, username, password, isActive, weeklyDayOffs } = await req.json();

    const data: any = {};
    if (name) data.name = name;
    if (username) data.username = username;
    if (isActive !== undefined) data.isActive = isActive;
    if (weeklyDayOffs !== undefined) data.weeklyDayOffs = weeklyDayOffs;
    if (password) {
      data.password = await hashPassword(password);
    }

    const worker = await prisma.worker.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, worker });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const prisma = await getPrisma();
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Worker ID is required" }, { status: 400 });
    }

    await prisma.attendance.deleteMany({ where: { workerId: parseInt(id) } });
    await prisma.worker.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

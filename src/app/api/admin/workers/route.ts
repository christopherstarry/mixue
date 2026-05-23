import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getAdminSession, hashPin } from "@/lib/auth";

export async function GET(req: Request) {
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

    const { name, phone, pin } = await req.json();

    if (!name || !phone || !pin) {
      return NextResponse.json(
        { error: "Name, phone, and PIN are required" },
        { status: 400 }
      );
    }

    if (pin.length < 4) {
      return NextResponse.json(
        { error: "PIN must be at least 4 digits" },
        { status: 400 }
      );
    }

    const existing = await prisma.worker.findFirst({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Worker with this phone already exists" },
        { status: 400 }
      );
    }

    const hashedPin = await hashPin(pin);

    const worker = await prisma.worker.create({
      data: { name, phone, pin: hashedPin },
    });

    return NextResponse.json({ success: true, worker });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const prisma = await getPrisma();
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, phone, pin, isActive } = await req.json();

    const data: any = {};
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;
    if (pin) {
      if (pin.length < 4) {
        return NextResponse.json(
          { error: "PIN must be at least 4 digits" },
          { status: 400 }
        );
      }
      data.pin = await hashPin(pin);
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

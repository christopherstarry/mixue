import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPin, createWorkerSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const prisma = await getPrisma();
    const { pin } = await req.json();
    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { error: "PIN must be at least 4 digits" },
        { status: 400 }
      );
    }

    const workers = await prisma.worker.findMany({ where: { isActive: true } });

    for (const worker of workers) {
      if (await verifyPin(pin, worker.pin)) {
        await createWorkerSession(worker.id);
        return NextResponse.json({
          success: true,
          worker: { id: worker.id, name: worker.name },
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid PIN" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

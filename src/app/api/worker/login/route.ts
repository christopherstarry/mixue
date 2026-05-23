import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPassword, createWorkerSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    const worker = await prisma.worker.findUnique({
      where: { username },
    });

    if (!worker || !worker.isActive) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (!(await verifyPassword(password, worker.password))) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await createWorkerSession(worker.id);

    return NextResponse.json({
      success: true,
      worker: { id: worker.id, name: worker.name },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

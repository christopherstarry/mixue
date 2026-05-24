import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPassword, createWorkerSession } from "@/lib/auth";

async function readCredentials(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    return {
      username: String(body.username || "").trim(),
      password: String(body.password || ""),
      isFormSubmit: false,
    };
  }

  const formData = await req.formData();
  return {
    username: String(formData.get("username") || "").trim(),
    password: String(formData.get("password") || ""),
    isFormSubmit: true,
  };
}

function loginError(req: Request, isFormSubmit: boolean, message: string, status: number) {
  if (isFormSubmit) {
    return NextResponse.redirect(new URL("/?login=failed", req.url), { status: 303 });
  }

  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const { username, password, isFormSubmit } = await readCredentials(req);

    if (!username || !password) {
      return loginError(req, isFormSubmit, "Username dan password wajib diisi", 400);
    }

    const prisma = await getPrisma();

    const worker = await prisma.worker.findUnique({
      where: { username },
    });

    if (!worker || !worker.isActive) {
      return loginError(req, isFormSubmit, "Invalid username or password", 401);
    }

    if (!(await verifyPassword(password, worker.password))) {
      return loginError(req, isFormSubmit, "Invalid username or password", 401);
    }

    await createWorkerSession(worker.id);

    if (isFormSubmit) {
      return NextResponse.redirect(new URL("/clock", req.url), { status: 303 });
    }

    return NextResponse.json({
      success: true,
      worker: { id: worker.id, name: worker.name },
    });
  } catch (error) {
    console.error("Login error:", error);
    return loginError(req, false, "Gagal login. Silakan coba lagi.", 500);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

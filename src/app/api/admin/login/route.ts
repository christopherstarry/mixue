import { NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (await authenticateAdmin(email, password)) {
      await createAdminSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { destroyWorkerSession } from "@/lib/auth";

export async function POST() {
  await destroyWorkerSession();
  return NextResponse.json({ success: true });
}

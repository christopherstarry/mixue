import { cookies } from "next/headers";
import { getPrisma } from "./prisma";

const ADMIN_EMAIL = "starryjovanka@mixue.com";
const ADMIN_PASSWORD = "Arcamanik109!";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return (await hashPassword(password)) === hashed;
}

export async function createWorkerSession(workerId: number) {
  const cookieStore = await cookies();
  cookieStore.set("worker_id", String(workerId), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getWorkerSession(): Promise<number | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get("worker_id")?.value;
  return id ? parseInt(id) : null;
}

export async function destroyWorkerSession() {
  const cookieStore = await cookies();
  cookieStore.delete("worker_id");
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set("admin_logged_in", "1", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_logged_in")?.value === "1";
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_logged_in");
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<boolean> {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export async function getAuthenticatedWorker() {
  const id = await getWorkerSession();
  if (!id) return null;
  const prisma = await getPrisma();
  const worker = await prisma.worker.findUnique({ where: { id } });
  if (!worker || !worker.isActive) return null;
  return worker;
}

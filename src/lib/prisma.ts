import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  initPromise: Promise<void>;
};

let prisma: PrismaClient;

async function initPrisma() {
  const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const config: any = { url };
  if (authToken) config.authToken = authToken;

  const adapter = new PrismaLibSql(config);
  prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
}

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  globalForPrisma.initPromise = initPrisma();
}

export { prisma };
export async function getPrisma(): Promise<PrismaClient> {
  if (prisma) return prisma;
  if (!globalForPrisma.initPromise) {
    globalForPrisma.initPromise = initPrisma();
  }
  await globalForPrisma.initPromise;
  return prisma;
}

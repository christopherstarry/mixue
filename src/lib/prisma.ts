import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  initPromise: Promise<void>;
};

let prisma: PrismaClient;

async function initPrisma() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  const adapter = new PrismaNeonHttp(connectionString || "", {
    arrayMode: false,
    fullResults: false,
  });
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

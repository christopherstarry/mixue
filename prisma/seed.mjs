import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error("Set DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  const passAhmad = createHash("sha256").update("ahmad123").digest("hex");
  const passBudi = createHash("sha256").update("budi123").digest("hex");

  await sql`
    INSERT INTO "Worker" (id, name, username, password, "isActive", "createdAt")
    VALUES (1, 'Ahmad', 'ahmad', ${passAhmad}, true, NOW())
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    INSERT INTO "Worker" (id, name, username, password, "isActive", "createdAt")
    VALUES (2, 'Budi', 'budi', ${passBudi}, true, NOW())
    ON CONFLICT (id) DO NOTHING
  `;

  console.log("Seeded:");
  console.log("  Ahmad - username: ahmad, password: ahmad123");
  console.log("  Budi  - username: budi,  password: budi123");
  console.log("Admin: starryjovanka@mixue.com / Arcamanik109!");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

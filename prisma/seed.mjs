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
  const pin1234 = createHash("sha256").update("1234").digest("hex");
  const pin0000 = createHash("sha256").update("0000").digest("hex");

  await sql`
    INSERT INTO "Worker" (id, name, phone, pin, "isActive", "createdAt")
    VALUES (1, 'Ahmad', '08123456789', ${pin1234}, true, NOW())
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    INSERT INTO "Worker" (id, name, phone, pin, "isActive", "createdAt")
    VALUES (2, 'Budi', '08198765432', ${pin0000}, true, NOW())
    ON CONFLICT (id) DO NOTHING
  `;

  console.log("Seeded: Ahmad (PIN: 1234), Budi (PIN: 0000)");
  console.log("Admin: admin@mixue.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

import { createClient } from "@libsql/client";
import { createHash } from "node:crypto";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient(authToken ? { url, authToken } : { url });

async function main() {
  const pin1234 = createHash("sha256").update("1234").digest("hex");
  const pin0000 = createHash("sha256").update("0000").digest("hex");

  await db.execute(`
    INSERT OR REPLACE INTO Worker (id, name, phone, pin, isActive, createdAt)
    VALUES (1, 'Ahmad', '08123456789', '${pin1234}', 1, datetime('now'))
  `);

  await db.execute(`
    INSERT OR REPLACE INTO Worker (id, name, phone, pin, isActive, createdAt)
    VALUES (2, 'Budi', '08198765432', '${pin0000}', 1, datetime('now'))
  `);

  console.log("Seeded: Ahmad (PIN: 1234), Budi (PIN: 0000)");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

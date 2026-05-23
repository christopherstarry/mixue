import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars");
  process.exit(1);
}

const db = createClient({ url, authToken });

const sql = `
CREATE TABLE IF NOT EXISTS "Worker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workerId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "clockInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockInPhoto" TEXT NOT NULL,
    "clockInLat" REAL,
    "clockInLng" REAL,
    "clockOutAt" DATETIME,
    "clockOutPhoto" TEXT,
    "clockOutLat" REAL,
    "clockOutLng" REAL,
    FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Attendance_workerId_idx" ON "Attendance"("workerId");
CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date");
`;

async function main() {
  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await db.execute(stmt + ";");
  }
  console.log("Tables created successfully");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

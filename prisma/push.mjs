import { execSync } from "node:child_process";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL;

if (!url) {
  console.error("Set DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL");
  process.exit(1);
}

console.log("Pushing schema to database...");
execSync(`npx prisma db push --accept-data-loss`, {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
console.log("Schema pushed!");

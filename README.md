# Mixue Attendance

Employee attendance system for FnB businesses. Built with Next.js + SQLite.

## Features

- **Worker clock in/out** with photo capture + GPS location
- **Admin dashboard** with monthly attendance filtered by worker
- **Worker management** — add, edit, toggle active/inactive
- **PIN-based login** — simple 4-6 digit PIN for workers

## Tech Stack

Next.js 16, Prisma 7, SQLite (via Turso or local), Tailwind CSS

## Running Locally

```bash
npm install
npm run dev      # runs on http://localhost:3000
node prisma/seed.mjs   # seed test data
```

## Test Credentials

| Role | Credentials |
|------|-------------|
| Worker | Ahmad (PIN: 1234) |
| Worker | Budi (PIN: 0000) |
| Admin | admin@mixue.com / admin123 |

## Deploy to Production (Free)

1. Create a Turso database: `turso db create mixue-attendance`
2. Deploy to Vercel — set env vars `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
3. Run `node prisma/seed.mjs` with those env vars to seed the remote DB

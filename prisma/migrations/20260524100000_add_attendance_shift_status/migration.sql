-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "shiftType" TEXT;
ALTER TABLE "Attendance" ADD COLUMN "scheduledStartAt" TIMESTAMP(3);
ALTER TABLE "Attendance" ADD COLUMN "latenessSeconds" INTEGER;
ALTER TABLE "Attendance" ADD COLUMN "attendanceStatus" TEXT;
ALTER TABLE "Attendance" ADD COLUMN "payStatus" TEXT;

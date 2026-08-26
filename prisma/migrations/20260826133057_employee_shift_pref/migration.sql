-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "shiftEnd" TEXT,
ADD COLUMN     "shiftStart" TEXT,
ADD COLUMN     "shiftType" TEXT NOT NULL DEFAULT 'VARIABLE';

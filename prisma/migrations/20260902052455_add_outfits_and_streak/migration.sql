-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_streak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "outfits" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "note" TEXT,
    "imageUrl" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outfits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outfits_userId_checkedInAt_idx" ON "outfits"("userId", "checkedInAt");

-- AddForeignKey
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

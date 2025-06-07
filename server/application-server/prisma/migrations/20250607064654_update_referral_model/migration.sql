-- DropForeignKey
ALTER TABLE "UserReferral" DROP CONSTRAINT "UserReferral_referrerOpenId_fkey";

-- AlterTable
ALTER TABLE "UserReferral" ALTER COLUMN "referrerOpenId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referrerOpenId_fkey" FOREIGN KEY ("referrerOpenId") REFERENCES "User"("openId") ON DELETE SET NULL ON UPDATE CASCADE;

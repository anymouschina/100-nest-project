-- AlterTable
ALTER TABLE "UserReferral" ADD COLUMN     "referralCodeId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

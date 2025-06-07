-- CreateTable
CREATE TABLE "UserReferral" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "refCode" TEXT NOT NULL,
    "referrerOpenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReferral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReferral_userId_key" ON "UserReferral"("userId");

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referrerOpenId_fkey" FOREIGN KEY ("referrerOpenId") REFERENCES "User"("openId") ON DELETE RESTRICT ON UPDATE CASCADE;

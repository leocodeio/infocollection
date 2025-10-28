-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'REDDIT', 'TWITTER', 'TIKTOK', 'LINKEDIN', 'FACEBOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "query" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keywords" TEXT[],
    "platforms" "Platform"[],
    "status" "QueryStatus" NOT NULL DEFAULT 'PENDING',
    "totalResults" INTEGER NOT NULL DEFAULT 0,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "query_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_result" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "attributes" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "query_userId_createdAt_idx" ON "query"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "query_status_idx" ON "query"("status");

-- CreateIndex
CREATE INDEX "query_result_queryId_idx" ON "query_result"("queryId");

-- AddForeignKey
ALTER TABLE "query" ADD CONSTRAINT "query_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_result" ADD CONSTRAINT "query_result_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "query"("id") ON DELETE CASCADE ON UPDATE CASCADE;

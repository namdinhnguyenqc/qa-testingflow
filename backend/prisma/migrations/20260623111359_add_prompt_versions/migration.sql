-- CreateTable
CREATE TABLE "aiqa_dev"."prompt_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_name_versionNo_key" ON "aiqa_dev"."prompt_versions"("name", "versionNo");

-- CreateIndex
CREATE INDEX "prompt_versions_name_idx" ON "aiqa_dev"."prompt_versions"("name");

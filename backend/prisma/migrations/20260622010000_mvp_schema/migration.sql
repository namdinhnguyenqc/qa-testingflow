-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "aiqa_dev";

SET search_path TO "aiqa_dev";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('DOCUMENT', 'SPREADSHEET', 'IMAGE', 'TEXT', 'FIGMA');

-- CreateEnum
CREATE TYPE "ArtifactStatus" AS ENUM ('UPLOADED', 'PARSING', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RequirementVersionStatus" AS ENUM ('DRAFT', 'ANALYZED', 'REWRITTEN', 'APPROVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "RequirementItemType" AS ENUM ('FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS_RULE', 'UI', 'DATA', 'INTEGRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "GapSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "GapStatus" AS ENUM ('OPEN', 'RESOLVED', 'ACCEPTED_RISK', 'REJECTED');

-- CreateEnum
CREATE TYPE "TestcaseSetStatus" AS ENUM ('DRAFT', 'GENERATED', 'NEEDS_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "TestcaseStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('COVERED', 'PARTIAL', 'MISSING', 'NOT_TESTABLE');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_USER', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'vi',
    "configOverrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "status" "ArtifactStatus" NOT NULL DEFAULT 'UPLOADED',
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storageKey" TEXT,
    "sourceText" TEXT,
    "parsedContent" JSONB,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "status" "ConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "contentJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceArtifactId" TEXT,
    "versionNo" INTEGER NOT NULL,
    "status" "RequirementVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "qualityScore" DOUBLE PRECISION,
    "qualityJson" JSONB,
    "contentJson" JSONB NOT NULL,
    "contentMarkdown" TEXT,
    "approvedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_items" (
    "id" TEXT NOT NULL,
    "requirementVersionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "type" "RequirementItemType" NOT NULL DEFAULT 'FUNCTIONAL',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "testable" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gap_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requirementVersionId" TEXT NOT NULL,
    "requirementItemId" TEXT,
    "externalId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "GapSeverity" NOT NULL,
    "status" "GapStatus" NOT NULL DEFAULT 'OPEN',
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gap_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testcase_sets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requirementVersionId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "status" "TestcaseSetStatus" NOT NULL DEFAULT 'DRAFT',
    "generationConfig" JSONB,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testcase_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "testcaseSetId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "module" TEXT,
    "feature" TEXT,
    "title" TEXT NOT NULL,
    "preconditions" TEXT,
    "steps" JSONB NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "type" TEXT NOT NULL,
    "status" "TestcaseStatus" NOT NULL DEFAULT 'DRAFT',
    "requirementRefs" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage_items" (
    "id" TEXT NOT NULL,
    "requirementVersionId" TEXT NOT NULL,
    "requirementItemId" TEXT NOT NULL,
    "testcaseSetId" TEXT NOT NULL,
    "status" "CoverageStatus" NOT NULL,
    "coveragePercent" DOUBLE PRECISION,
    "testcaseRefs" JSONB,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "workflowKey" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'QUEUED',
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_call_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "traceId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "skillVersion" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_artifacts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "testcaseSetId" TEXT,
    "format" TEXT NOT NULL DEFAULT 'xlsx',
    "status" "ExportStatus" NOT NULL DEFAULT 'QUEUED',
    "fileName" TEXT,
    "storageKey" TEXT,
    "sizeBytes" INTEGER,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artifacts_projectId_idx" ON "artifacts"("projectId");

-- CreateIndex
CREATE INDEX "config_versions_projectId_idx" ON "config_versions"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "config_versions_projectId_name_versionNo_key" ON "config_versions"("projectId", "name", "versionNo");

-- CreateIndex
CREATE INDEX "requirement_versions_projectId_idx" ON "requirement_versions"("projectId");

-- CreateIndex
CREATE INDEX "requirement_versions_sourceArtifactId_idx" ON "requirement_versions"("sourceArtifactId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_versions_projectId_versionNo_key" ON "requirement_versions"("projectId", "versionNo");

-- CreateIndex
CREATE INDEX "requirement_items_requirementVersionId_idx" ON "requirement_items"("requirementVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_items_requirementVersionId_externalId_key" ON "requirement_items"("requirementVersionId", "externalId");

-- CreateIndex
CREATE INDEX "gap_items_projectId_idx" ON "gap_items"("projectId");

-- CreateIndex
CREATE INDEX "gap_items_requirementVersionId_idx" ON "gap_items"("requirementVersionId");

-- CreateIndex
CREATE INDEX "gap_items_requirementItemId_idx" ON "gap_items"("requirementItemId");

-- CreateIndex
CREATE UNIQUE INDEX "gap_items_requirementVersionId_externalId_key" ON "gap_items"("requirementVersionId", "externalId");

-- CreateIndex
CREATE INDEX "testcase_sets_projectId_idx" ON "testcase_sets"("projectId");

-- CreateIndex
CREATE INDEX "testcase_sets_requirementVersionId_idx" ON "testcase_sets"("requirementVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "testcase_sets_projectId_requirementVersionId_versionNo_key" ON "testcase_sets"("projectId", "requirementVersionId", "versionNo");

-- CreateIndex
CREATE INDEX "test_cases_testcaseSetId_idx" ON "test_cases"("testcaseSetId");

-- CreateIndex
CREATE UNIQUE INDEX "test_cases_testcaseSetId_externalId_key" ON "test_cases"("testcaseSetId", "externalId");

-- CreateIndex
CREATE INDEX "coverage_items_requirementVersionId_idx" ON "coverage_items"("requirementVersionId");

-- CreateIndex
CREATE INDEX "coverage_items_testcaseSetId_idx" ON "coverage_items"("testcaseSetId");

-- CreateIndex
CREATE UNIQUE INDEX "coverage_items_requirementItemId_testcaseSetId_key" ON "coverage_items"("requirementItemId", "testcaseSetId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_runs_traceId_key" ON "workflow_runs"("traceId");

-- CreateIndex
CREATE INDEX "workflow_runs_projectId_idx" ON "workflow_runs"("projectId");

-- CreateIndex
CREATE INDEX "workflow_runs_status_idx" ON "workflow_runs"("status");

-- CreateIndex
CREATE INDEX "ai_call_logs_projectId_idx" ON "ai_call_logs"("projectId");

-- CreateIndex
CREATE INDEX "ai_call_logs_traceId_idx" ON "ai_call_logs"("traceId");

-- CreateIndex
CREATE INDEX "audit_logs_projectId_idx" ON "audit_logs"("projectId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "export_artifacts_projectId_idx" ON "export_artifacts"("projectId");

-- CreateIndex
CREATE INDEX "export_artifacts_testcaseSetId_idx" ON "export_artifacts"("testcaseSetId");

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_versions" ADD CONSTRAINT "config_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_versions" ADD CONSTRAINT "requirement_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_versions" ADD CONSTRAINT "requirement_versions_sourceArtifactId_fkey" FOREIGN KEY ("sourceArtifactId") REFERENCES "artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_items" ADD CONSTRAINT "requirement_items_requirementVersionId_fkey" FOREIGN KEY ("requirementVersionId") REFERENCES "requirement_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_items" ADD CONSTRAINT "gap_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_items" ADD CONSTRAINT "gap_items_requirementVersionId_fkey" FOREIGN KEY ("requirementVersionId") REFERENCES "requirement_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_items" ADD CONSTRAINT "gap_items_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "requirement_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testcase_sets" ADD CONSTRAINT "testcase_sets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testcase_sets" ADD CONSTRAINT "testcase_sets_requirementVersionId_fkey" FOREIGN KEY ("requirementVersionId") REFERENCES "requirement_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_testcaseSetId_fkey" FOREIGN KEY ("testcaseSetId") REFERENCES "testcase_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_items" ADD CONSTRAINT "coverage_items_requirementVersionId_fkey" FOREIGN KEY ("requirementVersionId") REFERENCES "requirement_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_items" ADD CONSTRAINT "coverage_items_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "requirement_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_items" ADD CONSTRAINT "coverage_items_testcaseSetId_fkey" FOREIGN KEY ("testcaseSetId") REFERENCES "testcase_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_call_logs" ADD CONSTRAINT "ai_call_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_artifacts" ADD CONSTRAINT "export_artifacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_artifacts" ADD CONSTRAINT "export_artifacts_testcaseSetId_fkey" FOREIGN KEY ("testcaseSetId") REFERENCES "testcase_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

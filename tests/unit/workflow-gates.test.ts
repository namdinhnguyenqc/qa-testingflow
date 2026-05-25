import { afterEach, describe, expect, it, vi } from "vitest"

const confirmedUnderstandingArtifact = {
  id: "understanding-1",
  feature_id: "feature-1",
  artifact_type: "FEATURE_UNDERSTANDING",
  version_no: 1,
  content_json: { ready_for_official_testcases: true },
  schema_key: "feature_understanding",
  schema_version: "0.1.0",
  status: "CONFIRMED",
  created_at: new Date().toISOString(),
}

async function loadServiceWithMocks(dbMock: Record<string, any>, executeStep = vi.fn()) {
  vi.resetModules()
  vi.doMock("@/infrastructure/database/supabase-db-adapter", () => ({
    SupabaseDbAdapter: vi.fn().mockImplementation(() => dbMock),
  }))
  vi.doMock("@/application/ai/ai-execution-service", () => ({
    AiExecutionService: vi.fn().mockImplementation(() => ({ executeStep })),
  }))
  const { TestCaseService } = await import("@/application/testcases/testcase-service")
  return { service: new TestCaseService(), executeStep }
}

describe("Phase 01 workflow gates", () => {
  afterEach(() => {
    vi.doUnmock("@/infrastructure/database/supabase-db-adapter")
    vi.doUnmock("@/application/ai/ai-execution-service")
  })

  it("blocks official testcase generation until Feature Understanding is confirmed", async () => {
    const dbMock = {
      getLatestArtifactByType: vi.fn(async () => null),
    }
    const { service, executeStep } = await loadServiceWithMocks(dbMock)

    await expect(
      service.generateTestCases({
        projectId: "project-1",
        featureId: "feature-1",
        modelId: "gpt-4o",
      })
    ).rejects.toThrow("Feature Understanding must be confirmed before generating official test cases.")

    expect(executeStep).not.toHaveBeenCalled()
  })

  it("blocks official testcase generation while critical clarification is unresolved", async () => {
    const dbMock = {
      getLatestArtifactByType: vi.fn(async () => confirmedUnderstandingArtifact),
      getOrCreateClarificationThread: vi.fn(async () => ({
        id: "thread-1",
        feature_id: "feature-1",
        status: "OPEN",
        created_at: new Date().toISOString(),
      })),
      getClarificationMessagesByThreadId: vi.fn(async () => [
        {
          id: "msg-1",
          thread_id: "thread-1",
          feature_id: "feature-1",
          sender_type: "AI",
          content: "Clarify lockout policy",
          is_critical: true,
          question_key: "lockout_policy",
          created_at: new Date().toISOString(),
        },
      ]),
    }
    const { service, executeStep } = await loadServiceWithMocks(dbMock)

    await expect(
      service.generateTestCases({
        projectId: "project-1",
        featureId: "feature-1",
        modelId: "gpt-4o",
      })
    ).rejects.toThrow("Critical clarification must be answered and resolved before official/final test cases.")

    expect(executeStep).not.toHaveBeenCalled()
  })

  it("blocks final testcase save when critical clarification is answered but thread is not resolved", async () => {
    const getTestCasesByArtifactId = vi.fn()
    const dbMock = {
      getLatestArtifactByType: vi.fn(async () => confirmedUnderstandingArtifact),
      getOrCreateClarificationThread: vi.fn(async () => ({
        id: "thread-1",
        feature_id: "feature-1",
        status: "READY_FOR_REVIEW",
        created_at: new Date().toISOString(),
      })),
      getClarificationMessagesByThreadId: vi.fn(async () => [
        {
          id: "msg-1",
          thread_id: "thread-1",
          feature_id: "feature-1",
          sender_type: "AI",
          content: "Clarify lockout policy",
          is_critical: true,
          question_key: "lockout_policy",
          created_at: new Date().toISOString(),
        },
        {
          id: "msg-2",
          thread_id: "thread-1",
          feature_id: "feature-1",
          sender_type: "USER",
          content: "Auto unlock after 15 minutes",
          is_critical: false,
          question_key: "lockout_policy",
          created_at: new Date().toISOString(),
        },
      ]),
      getTestCasesByArtifactId,
    }
    const { service } = await loadServiceWithMocks(dbMock)

    await expect(service.saveFinalVersion("feature-1", "testcase-artifact-1")).rejects.toThrow(
      "Critical clarification must be answered and resolved before official/final test cases."
    )

    expect(getTestCasesByArtifactId).not.toHaveBeenCalled()
  })
})

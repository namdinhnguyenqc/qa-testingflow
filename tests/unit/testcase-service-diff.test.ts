import { afterEach, describe, expect, it, vi } from "vitest"
import { TestCase } from "@/domain/testcases/types"

function makeTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: "tc-1",
    feature_id: "feature-1",
    artifact_id: "generated-artifact",
    test_case_code: "TC_AUTH_001",
    module: "Authentication",
    scenario: "Login succeeds",
    case_type: "Happy",
    priority: "P1",
    preconditions_json: ["User exists"],
    steps_json: [{ step_no: 1, action: "Login", expected_result: "Dashboard opens" }],
    test_data_json: { email: "user@example.com" },
    expected_result: "Dashboard opens.",
    automation_candidate: true,
    requirement_mapping_json: ["REQ_AUTH_001"],
    status: "DRAFT",
    created_at: "2026-05-27T00:00:00.000Z",
    ...overrides,
  }
}

async function loadServiceWithDb(dbMock: Record<string, any>) {
  vi.resetModules()
  vi.doMock("@/infrastructure/database/supabase-db-adapter", () => ({
    SupabaseDbAdapter: vi.fn().mockImplementation(() => dbMock),
  }))
  vi.doMock("@/application/ai/ai-execution-service", () => ({
    AiExecutionService: vi.fn().mockImplementation(() => ({})),
  }))
  const { TestCaseService } = await import("@/application/testcases/testcase-service")
  return new TestCaseService()
}

describe("TestCaseService Phase 02 diff", () => {
  afterEach(() => {
    vi.doUnmock("@/infrastructure/database/supabase-db-adapter")
    vi.doUnmock("@/application/ai/ai-execution-service")
  })

  it("returns generated vs final testcase diff without mutating artifacts", async () => {
    const generatedCase = makeTestCase()
    const finalCase = makeTestCase({
      artifact_id: "final-artifact",
      priority: "P0",
      status: "FINAL",
    })
    const getTestCasesByArtifactId = vi.fn(async (artifactId: string) => {
      if (artifactId === "generated-artifact") return [generatedCase]
      if (artifactId === "final-artifact") return [finalCase]
      return []
    })
    const service = await loadServiceWithDb({ getTestCasesByArtifactId })

    const diff = await service.getGeneratedVsFinalDiff("generated-artifact", "final-artifact")

    expect(getTestCasesByArtifactId).toHaveBeenCalledWith("generated-artifact")
    expect(getTestCasesByArtifactId).toHaveBeenCalledWith("final-artifact")
    expect(diff.summary).toEqual({
      addedCount: 0,
      removedCount: 0,
      modifiedCount: 1,
      editedFieldCount: 1,
    })
    expect(diff.modified[0].changes).toEqual([
      {
        field: "priority",
        generatedValue: "P1",
        finalValue: "P0",
      },
    ])
  })
})

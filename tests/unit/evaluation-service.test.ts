import { afterEach, describe, expect, it, vi } from "vitest"

async function loadServiceWithDb(dbMock: Record<string, any>) {
  vi.resetModules()
  vi.doMock("@/infrastructure/database/supabase-db-adapter", () => ({
    SupabaseDbAdapter: vi.fn().mockImplementation(() => dbMock),
  }))
  const { EvaluationService } = await import("@/application/evaluations/evaluation-service")
  return new EvaluationService()
}

describe("Phase 02 EvaluationService", () => {
  afterEach(() => {
    vi.doUnmock("@/infrastructure/database/supabase-db-adapter")
  })

  it("saves artifact feedback without mutating the source artifact", async () => {
    const createArtifactFeedback = vi.fn(async (dto) => ({
      id: "feedback-1",
      created_at: "2026-05-27T00:00:00.000Z",
      is_golden_candidate: false,
      issue_categories: [],
      ...dto,
    }))
    const service = await loadServiceWithDb({ createArtifactFeedback })

    const feedback = await service.createArtifactFeedback({
      artifact_id: "artifact-1",
      feature_id: "feature-1",
      rating: "NEEDS_REVISION",
      issue_categories: ["missing_rule"],
      comment: "Missing password lockout rules.",
    })

    expect(createArtifactFeedback).toHaveBeenCalledTimes(1)
    expect(feedback.rating).toBe("NEEDS_REVISION")
    expect(feedback.issue_categories).toEqual(["missing_rule"])
  })

  it("calculates feedback, issue, golden, and model metrics", async () => {
    const service = await loadServiceWithDb({
      getArtifactFeedbackByFeatureId: vi.fn(async () => [
        {
          id: "feedback-1",
          artifact_id: "artifact-1",
          feature_id: "feature-1",
          rating: "GOOD",
          issue_categories: [],
          is_golden_candidate: true,
          created_at: "2026-05-27T00:00:00.000Z",
        },
        {
          id: "feedback-2",
          artifact_id: "artifact-2",
          feature_id: "feature-1",
          rating: "REJECTED",
          issue_categories: ["duplicate_case", "wrong_format"],
          is_golden_candidate: false,
          created_at: "2026-05-27T00:00:00.000Z",
        },
      ]),
      getEvaluationRunsByFeatureId: vi.fn(async () => [{ id: "run-1" }]),
      getEvaluationResultsByFeatureId: vi.fn(async () => [
        { id: "result-1", model_id: "gpt-a" },
        { id: "result-2", model_id: "gpt-b" },
        { id: "result-3", model_id: "gpt-a" },
      ]),
    })

    const summary = await service.getFeatureEvaluationSummary("feature-1")

    expect(summary.metrics).toMatchObject({
      totalFeedback: 2,
      goodCount: 1,
      needsRevisionCount: 0,
      rejectedCount: 1,
      goldenCandidateCount: 1,
      evaluationRunCount: 1,
      resultCountByModel: {
        "gpt-a": 2,
        "gpt-b": 1,
      },
    })
    expect(summary.metrics.issueCategoryCounts.duplicate_case).toBe(1)
    expect(summary.metrics.issueCategoryCounts.wrong_format).toBe(1)
  })
})

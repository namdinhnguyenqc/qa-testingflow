import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import { diffTestCaseSets, TestCaseSetDiff } from "@/domain/testcases/diff"
import {
  ArtifactFeedback,
  ArtifactFeedbackIssueCategory,
  CreateArtifactFeedbackDTO,
  EvaluationMetrics,
  EvaluationResult,
  EvaluationRun,
} from "@/domain/evaluations/types"

const ISSUE_CATEGORIES: ArtifactFeedbackIssueCategory[] = [
  "missing_rule",
  "duplicate_case",
  "unclear_expected_result",
  "wrong_format",
  "unnecessary_questions",
]

export class EvaluationService {
  private dbAdapter: SupabaseDbAdapter

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
  }

  async createArtifactFeedback(dto: CreateArtifactFeedbackDTO): Promise<ArtifactFeedback> {
    return this.dbAdapter.createArtifactFeedback(dto)
  }

  async getArtifactFeedback(artifactId: string): Promise<ArtifactFeedback[]> {
    return this.dbAdapter.getArtifactFeedbackByArtifactId(artifactId)
  }

  async getFeatureFeedback(featureId: string): Promise<ArtifactFeedback[]> {
    return this.dbAdapter.getArtifactFeedbackByFeatureId(featureId)
  }

  async getGeneratedVsFinalDiff(generatedArtifactId: string, finalArtifactId: string): Promise<TestCaseSetDiff> {
    const [generatedCases, finalCases] = await Promise.all([
      this.dbAdapter.getTestCasesByArtifactId(generatedArtifactId),
      this.dbAdapter.getTestCasesByArtifactId(finalArtifactId),
    ])

    return diffTestCaseSets(generatedCases, finalCases)
  }

  async createModelComparisonSnapshot(params: {
    featureId: string
    stepKey: string
    modelAId: string
    modelBId: string
    artifactAId: string
    artifactBId: string
  }): Promise<{ run: EvaluationRun; results: EvaluationResult[] }> {
    const [artifactA, artifactB] = await Promise.all([
      this.dbAdapter.getTestCasesByArtifactId(params.artifactAId),
      this.dbAdapter.getTestCasesByArtifactId(params.artifactBId),
    ])

    const run = await this.dbAdapter.createEvaluationRun({
      feature_id: params.featureId,
      step_key: params.stepKey,
      skill_file_path: "manual/testcase-generator.skill.md",
      schema_key: "manual_testcase",
      schema_version: "0.1.0",
      model_a_id: params.modelAId,
      model_b_id: params.modelBId,
      input_snapshot_json: {
        compared_artifact_ids: [params.artifactAId, params.artifactBId],
      },
      status: "COMPLETED",
    })

    const results = await Promise.all([
      this.dbAdapter.createEvaluationResult({
        evaluation_run_id: run.id,
        feature_id: params.featureId,
        model_id: params.modelAId,
        artifact_id: params.artifactAId,
        output_json: { test_cases: artifactA },
        validation_status: "VALID",
      }),
      this.dbAdapter.createEvaluationResult({
        evaluation_run_id: run.id,
        feature_id: params.featureId,
        model_id: params.modelBId,
        artifact_id: params.artifactBId,
        output_json: { test_cases: artifactB },
        validation_status: "VALID",
      }),
    ])

    return { run, results }
  }

  async getFeatureEvaluationSummary(featureId: string): Promise<{
    feedback: ArtifactFeedback[]
    evaluationRuns: EvaluationRun[]
    evaluationResults: EvaluationResult[]
    metrics: EvaluationMetrics
  }> {
    const [feedback, evaluationRuns, evaluationResults] = await Promise.all([
      this.dbAdapter.getArtifactFeedbackByFeatureId(featureId),
      this.dbAdapter.getEvaluationRunsByFeatureId(featureId),
      this.dbAdapter.getEvaluationResultsByFeatureId(featureId),
    ])

    return {
      feedback,
      evaluationRuns,
      evaluationResults,
      metrics: this.calculateMetrics(feedback, evaluationRuns, evaluationResults),
    }
  }

  private calculateMetrics(
    feedback: ArtifactFeedback[],
    evaluationRuns: EvaluationRun[],
    evaluationResults: EvaluationResult[]
  ): EvaluationMetrics {
    const issueCategoryCounts = ISSUE_CATEGORIES.reduce<Record<ArtifactFeedbackIssueCategory, number>>((counts, key) => {
      counts[key] = 0
      return counts
    }, {} as Record<ArtifactFeedbackIssueCategory, number>)

    const resultCountByModel: Record<string, number> = {}

    for (const entry of feedback) {
      for (const issue of entry.issue_categories) {
        issueCategoryCounts[issue] += 1
      }
    }

    for (const result of evaluationResults) {
      resultCountByModel[result.model_id] = (resultCountByModel[result.model_id] || 0) + 1
    }

    return {
      totalFeedback: feedback.length,
      goodCount: feedback.filter((entry) => entry.rating === "GOOD").length,
      needsRevisionCount: feedback.filter((entry) => entry.rating === "NEEDS_REVISION").length,
      rejectedCount: feedback.filter((entry) => entry.rating === "REJECTED").length,
      goldenCandidateCount: feedback.filter((entry) => entry.is_golden_candidate).length,
      issueCategoryCounts,
      evaluationRunCount: evaluationRuns.length,
      resultCountByModel,
    }
  }
}

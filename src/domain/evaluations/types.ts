export type ArtifactFeedbackRating = "GOOD" | "NEEDS_REVISION" | "REJECTED"

export type ArtifactFeedbackIssueCategory =
  | "missing_rule"
  | "duplicate_case"
  | "unclear_expected_result"
  | "wrong_format"
  | "unnecessary_questions"

export interface ArtifactFeedback {
  id: string
  artifact_id: string
  feature_id: string
  generated_artifact_id?: string
  final_artifact_id?: string
  rating: ArtifactFeedbackRating
  issue_categories: ArtifactFeedbackIssueCategory[]
  comment?: string
  is_golden_candidate: boolean
  created_at: string
}

export interface CreateArtifactFeedbackDTO {
  artifact_id: string
  feature_id: string
  generated_artifact_id?: string
  final_artifact_id?: string
  rating: ArtifactFeedbackRating
  issue_categories?: ArtifactFeedbackIssueCategory[]
  comment?: string
  is_golden_candidate?: boolean
}

export type EvaluationRunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED"

export interface EvaluationRun {
  id: string
  feature_id: string
  step_key: string
  skill_file_path: string
  skill_revision?: string
  schema_key: string
  schema_version: string
  model_a_id: string
  model_b_id: string
  input_snapshot_json: Record<string, any>
  status: EvaluationRunStatus
  created_at: string
  completed_at?: string
}

export interface EvaluationResult {
  id: string
  evaluation_run_id: string
  feature_id: string
  model_id: string
  artifact_id?: string
  output_json: Record<string, any>
  validation_status: string
  error_summary?: string
  created_at: string
}

export interface CreateEvaluationRunDTO {
  feature_id: string
  step_key: string
  skill_file_path: string
  skill_revision?: string
  schema_key: string
  schema_version: string
  model_a_id: string
  model_b_id: string
  input_snapshot_json: Record<string, any>
  status?: EvaluationRunStatus
}

export interface CreateEvaluationResultDTO {
  evaluation_run_id: string
  feature_id: string
  model_id: string
  artifact_id?: string
  output_json: Record<string, any>
  validation_status?: string
  error_summary?: string
}

export interface EvaluationMetrics {
  totalFeedback: number
  goodCount: number
  needsRevisionCount: number
  rejectedCount: number
  goldenCandidateCount: number
  issueCategoryCounts: Record<ArtifactFeedbackIssueCategory, number>
  evaluationRunCount: number
  resultCountByModel: Record<string, number>
}

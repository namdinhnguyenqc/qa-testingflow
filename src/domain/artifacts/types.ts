export type ArtifactType =
  | "REQUIREMENT_ANALYSIS"
  | "READINESS_RESULT"
  | "FEATURE_UNDERSTANDING"
  | "TESTCASE_SET"
  | "TESTCASE_FINAL"
  | "UI_EXPLORATION"

export type ArtifactStatus = "DRAFT" | "CONFIRMED" | "FINAL" | "SUPERSEDED"

export interface Artifact {
  id: string
  feature_id: string
  step_run_id?: string
  parent_artifact_id?: string
  artifact_type: ArtifactType
  version_no: number
  content_json: Record<string, any>
  schema_key: string
  schema_version: string
  status: ArtifactStatus
  created_at: string
  confirmed_at?: string
}

export interface CreateArtifactDTO {
  feature_id: string
  step_run_id?: string
  parent_artifact_id?: string
  artifact_type: ArtifactType
  version_no?: number
  content_json: Record<string, any>
  schema_key: string
  schema_version: string
  status?: ArtifactStatus
}

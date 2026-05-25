export type WorkflowRunStatus = "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED"

export interface WorkflowRun {
  id: string
  feature_id: string
  workflow_key: string
  workflow_file_path: string
  workflow_revision?: string
  initiated_model_id?: string
  status: WorkflowRunStatus
  started_at: string
  completed_at?: string
}

export type StepRunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED"

export type ValidationStatus = "PENDING" | "VALID" | "INVALID" | "REPAIRED" | "FAILED"

export interface StepRun {
  id: string
  workflow_run_id: string
  feature_id: string
  step_key: string
  skill_file_path: string
  skill_revision?: string
  schema_key: string
  schema_version: string
  provider_id: string
  model_id: string
  input_snapshot_json: Record<string, any>
  raw_output_text?: string
  validated_output_json?: Record<string, any>
  validation_status: ValidationStatus
  repair_attempts: number
  error_summary?: string
  status: StepRunStatus
  created_at: string
  completed_at?: string
}

export interface CreateWorkflowRunDTO {
  feature_id: string
  workflow_key: string
  workflow_file_path: string
  workflow_revision?: string
  initiated_model_id?: string
}

export interface CreateStepRunDTO {
  workflow_run_id: string
  feature_id: string
  step_key: string
  skill_file_path: string
  skill_revision?: string
  schema_key: string
  schema_version: string
  provider_id: string
  model_id: string
  input_snapshot_json: Record<string, any>
}

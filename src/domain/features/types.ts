export type FeatureStatus =
  | "DRAFT"
  | "INPUT_READY"
  | "ANALYZING"
  | "NEEDS_CLARIFICATION"
  | "READY_FOR_UNDERSTANDING"
  | "UNDERSTANDING_REVIEW"
  | "UNDERSTANDING_CONFIRMED"
  | "TESTCASE_GENERATING"
  | "TESTCASE_DRAFTED"
  | "COMPLETED"
  | "FAILED"

export interface Feature {
  id: string
  project_id: string
  name: string
  description?: string
  workflow_key: string
  selected_model_id?: string
  status: FeatureStatus
  current_step_key: string
  created_at: string
  updated_at: string
}

export interface CreateFeatureDTO {
  project_id: string
  name: string
  description?: string
  workflow_key?: string
  selected_model_id?: string
}

export interface UpdateFeatureDTO {
  name?: string
  description?: string
  selected_model_id?: string
  status?: FeatureStatus
  current_step_key?: string
}

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
  status: FeatureStatus
  created_at: string
  updated_at: string
}

export interface CreateFeatureDTO {
  project_id: string
  name: string
  description?: string
}

export interface UpdateFeatureDTO {
  name?: string
  description?: string
  status?: FeatureStatus
}

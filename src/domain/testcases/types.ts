export type CaseType =
  | "Happy"
  | "Validation"
  | "Negative"
  | "Boundary"
  | "Permission"
  | "UI"
  | "Error Handling"
  | "Regression"

export type Priority = "P0" | "P1" | "P2" | "P3"

export type TestCaseStatus = "DRAFT" | "FINAL"

export interface TestCaseStep {
  step_no: number
  action: string
  expected_result: string
}

export interface TestCase {
  id: string
  feature_id: string
  artifact_id: string
  test_case_code: string
  module: string
  scenario: string
  case_type: CaseType
  priority: Priority
  preconditions_json: string[]
  steps_json: TestCaseStep[]
  test_data_json?: Record<string, any>
  expected_result: string
  automation_candidate: boolean
  requirement_mapping_json?: string[]
  status: TestCaseStatus
  created_at: string
}

export interface CreateTestCaseDTO {
  feature_id: string
  artifact_id: string
  test_case_code: string
  module: string
  scenario: string
  case_type: CaseType
  priority: Priority
  preconditions_json: string[]
  steps_json: TestCaseStep[]
  test_data_json?: Record<string, any>
  expected_result: string
  automation_candidate?: boolean
  requirement_mapping_json?: string[]
  status?: TestCaseStatus
}

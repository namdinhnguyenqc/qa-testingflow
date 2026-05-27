export type UiExplorationJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED"

export interface FeatureEnvironment {
  id: string
  feature_id: string
  name: string
  base_url: string
  allowed_domains: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateFeatureEnvironmentDTO {
  feature_id: string
  name?: string
  base_url: string
  allowed_domains: string[]
  is_active?: boolean
}

export interface UiExplorationJob {
  id: string
  feature_id: string
  environment_id: string
  target_url: string
  allowed_domains: string[]
  status: UiExplorationJobStatus
  progress_message?: string
  artifact_id?: string
  error_summary?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface CreateUiExplorationJobDTO {
  feature_id: string
  environment_id: string
  target_url: string
  allowed_domains: string[]
  status?: UiExplorationJobStatus
  progress_message?: string
}

export interface UiExplorationSnapshot {
  target_url: string
  screens: {
    name: string
    url: string
    controls: {
      role: string
      label: string
      required?: boolean
      disabled?: boolean
    }[]
    messages: string[]
    navigation_targets: string[]
  }[]
  observed_differences: {
    severity: "critical" | "major" | "minor"
    source: "docs" | "figma" | "ui"
    description: string
    suggested_clarification?: string
  }[]
}

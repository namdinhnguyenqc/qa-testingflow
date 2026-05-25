export type ThreadStatus = "OPEN" | "READY_FOR_REVIEW" | "RESOLVED"

export interface ClarificationThread {
  id: string
  feature_id: string
  source_artifact_id?: string
  status: ThreadStatus
  created_at: string
}

export type SenderType = "AI" | "USER"

export type QuestionCategory =
  | "business_rule"
  | "validation"
  | "permission"
  | "state"
  | "error"
  | "ui_conflict"

export interface ClarificationMessage {
  id: string
  thread_id: string
  feature_id: string
  sender_type: SenderType
  category?: QuestionCategory
  content: string
  is_critical: boolean
  question_key?: string
  related_source_refs?: Record<string, any>
  created_at: string
}

export interface CreateThreadDTO {
  feature_id: string
  source_artifact_id?: string
  status?: ThreadStatus
}

export interface CreateMessageDTO {
  thread_id: string
  feature_id: string
  sender_type: SenderType
  category?: QuestionCategory
  content: string
  is_critical?: boolean
  question_key?: string
  related_source_refs?: Record<string, any>
}

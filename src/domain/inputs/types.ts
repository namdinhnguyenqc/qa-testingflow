export type SourceType =
  | "requirement_text"
  | "requirement_file"
  | "figma_image"
  | "figma_pdf"
  | "figma_url"
  | "api_doc"
  | "staging_url"

export type ProcessingStatus =
  | "UPLOADED"
  | "TEXT_AVAILABLE"
  | "REFERENCE_ONLY"
  | "PARSE_FAILED"
  | "REMOVED"

export interface InputSource {
  id: string
  feature_id: string
  source_type: SourceType
  title?: string
  original_file_name?: string
  storage_bucket?: string
  storage_path?: string
  mime_type?: string
  size_bytes?: number
  text_content?: string
  processing_status: ProcessingStatus
  created_at: string
}

export interface CreateInputSourceDTO {
  feature_id: string
  source_type: SourceType
  title?: string
  original_file_name?: string
  storage_bucket?: string
  storage_path?: string
  mime_type?: string
  size_bytes?: number
  text_content?: string
  processing_status?: ProcessingStatus
}

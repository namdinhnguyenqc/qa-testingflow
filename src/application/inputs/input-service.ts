import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import { SupabaseStorageAdapter } from "@/infrastructure/storage/supabase-storage-adapter"
import { InputSource, CreateInputSourceDTO, SourceType } from "@/domain/inputs/types"
import { determineFeatureStatus } from "@/domain/features/state-machine"

export class InputService {
  private dbAdapter: SupabaseDbAdapter
  private storageAdapter: SupabaseStorageAdapter

  private allowedExtensions = [
    // Requirement docs
    ".md", ".txt", ".pdf", ".docx",
    // Figma images
    ".png", ".jpg", ".jpeg", ".webp"
  ]

  private maxSizeBytes = 10 * 1024 * 1024 // 10MB

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
    this.storageAdapter = new SupabaseStorageAdapter()
  }

  async getInputSources(featureId: string): Promise<InputSource[]> {
    return this.dbAdapter.getInputSourcesByFeatureId(featureId)
  }

  /**
   * Lưu requirement text paste trực tiếp
   */
  async savePastedRequirement(featureId: string, text: string): Promise<InputSource> {
    const trimmedText = text.trim()
    if (trimmedText.length < 10) {
      throw new Error("Requirement text is too short (minimum 10 characters)")
    }

    const feature = await this.dbAdapter.getFeatureById(featureId)
    if (!feature) {
      throw new Error(`Feature ${featureId} does not exist`)
    }

    const inputSource = await this.dbAdapter.createInputSource({
      feature_id: featureId,
      source_type: "requirement_text",
      title: "Pasted Requirement Notes",
      text_content: trimmedText,
      status: "TEXT_AVAILABLE",
    })

    // Trigger state check & update
    await this.updateFeatureStatusIfNecessary(featureId)

    return inputSource
  }

  /**
   * Tải file tài liệu/hình ảnh lên và ghi nhận metadata
   */
  async uploadInputFile(
    projectId: string,
    featureId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    sizeBytes: number
  ): Promise<InputSource> {
    // 1. Validations
    if (sizeBytes > this.maxSizeBytes) {
      throw new Error(`File size exceeds 10MB limit (Current: ${(sizeBytes / (1024 * 1024)).toFixed(2)}MB)`)
    }

    const extIndex = fileName.lastIndexOf(".")
    if (extIndex === -1) {
      throw new Error("File has no extension")
    }
    const ext = fileName.substring(extIndex).toLowerCase()
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`File extension ${ext} is not allowed`)
    }

    const feature = await this.dbAdapter.getFeatureById(featureId)
    if (!feature) {
      throw new Error(`Feature ${featureId} does not exist`)
    }

    // Determine source type based on extension
    let sourceType: SourceType = "requirement_file"
    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      sourceType = "figma_image"
    } else if (ext === ".pdf" && fileName.toLowerCase().includes("figma")) {
      sourceType = "figma_pdf"
    }

    // 2. Upload to Supabase Storage
    const storageResult = await this.storageAdapter.uploadFile(
      projectId,
      featureId,
      fileName,
      fileBuffer,
      mimeType
    )

    // 3. Save to database
    // Default status
    let status: InputSource["status"] = "UPLOADED"
    // text files are immediately available as text context, pdf/docx will be extracted later in Phase 01
    if ([".txt", ".md"].includes(ext)) {
      status = "TEXT_AVAILABLE"
    }

    const inputSource = await this.dbAdapter.createInputSource({
      feature_id: featureId,
      source_type: sourceType,
      title: fileName,
      original_file_name: fileName,
      storage_bucket: storageResult.bucket,
      storage_path: storageResult.path,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      text_content: [".txt", ".md"].includes(ext) ? fileBuffer.toString("utf-8") : undefined,
      status: status,
    })

    // Trigger state check & update
    await this.updateFeatureStatusIfNecessary(featureId)

    return inputSource
  }

  /**
   * Sinh signed URL để hiển thị/tải file
   */
  async getSignedUrl(storagePath: string): Promise<string> {
    return this.storageAdapter.getSignedUrl(storagePath)
  }

  /**
   * Đánh dấu exclude/removed input source (Soft delete)
   */
  async removeInputSource(id: string, featureId: string): Promise<void> {
    await this.dbAdapter.updateInputSourceStatus(id, "REMOVED")
    
    // Trigger state check & update
    await this.updateFeatureStatusIfNecessary(featureId)
  }

  /**
   * Cập nhật trạng thái feature dựa trên state machine và input sources hiện có
   */
  private async updateFeatureStatusIfNecessary(featureId: string): Promise<void> {
    const feature = await this.dbAdapter.getFeatureById(featureId)
    if (!feature) return

    const sources = await this.dbAdapter.getInputSourcesByFeatureId(featureId)
    const nextStatus = determineFeatureStatus(feature.status, sources)

    if (nextStatus !== feature.status) {
      await this.dbAdapter.updateFeature(featureId, {
        status: nextStatus,
      })
    }
  }
}

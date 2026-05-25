import { supabaseServer } from "@/lib/supabase"

export class SupabaseStorageAdapter {
  private bucketName = "qa-inputs"

  /**
   * Upload file lên private bucket của Supabase Storage.
   * Path: projects/{projectId}/features/{featureId}/requirements/{uuid}-{sanitizedFilename}
   */
  async uploadFile(
    projectId: string,
    featureId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ path: string; bucket: string }> {
    const uuid = crypto.randomUUID()
    const sanitizedName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "_")
      .replace(/_+/g, "_")
    
    const storagePath = `projects/${projectId}/features/${featureId}/requirements/${uuid}-${sanitizedName}`

    const { error } = await supabaseServer.storage
      .from(this.bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (error) {
      throw new Error(`Failed to upload file to storage: ${error.message}`)
    }

    return {
      path: storagePath,
      bucket: this.bucketName,
    }
  }

  /**
   * Sinh signed URL thời hạn ngắn để truy cập file an toàn.
   */
  async getSignedUrl(storagePath: string, expiresInSeconds: number = 900): Promise<string> {
    const { data, error } = await supabaseServer.storage
      .from(this.bucketName)
      .createSignedUrl(storagePath, expiresInSeconds)

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`)
    }

    return data.signedUrl
  }

  /**
   * Xoá file khỏi storage.
   */
  async deleteFile(storagePath: string): Promise<void> {
    const { error } = await supabaseServer.storage
      .from(this.bucketName)
      .remove([storagePath])

    if (error) {
      throw new Error(`Failed to delete file from storage: ${error.message}`)
    }
  }
}

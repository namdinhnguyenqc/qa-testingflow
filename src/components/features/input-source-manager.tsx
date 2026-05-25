"use client"

import { useState, useRef } from "react"
import { UploadCloud, FileText, Trash2, Eye, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { cn, formatBytes, formatDate } from "@/lib/utils"
import { InputSource } from "@/domain/inputs/types"
import { savePastedRequirementAction, removeInputSourceAction } from "@/app/actions"

interface InputSourceManagerProps {
  projectId: string
  featureId: string
  initialSources: InputSource[]
  onRefresh: () => void
}

export function InputSourceManager({ projectId, featureId, initialSources, onRefresh }: InputSourceManagerProps) {
  const [pastedText, setPastedText] = useState("")
  const [textSaving, setTextSaving] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)
  const [textSuccess, setTextSuccess] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeSources = initialSources.filter((s) => s.status !== "REMOVED")

  // === Xử lý Paste Text ===
  const handleSaveText = async () => {
    if (pastedText.trim().length < 10) {
      setTextError("Requirement text must be at least 10 characters long")
      return
    }
    setTextSaving(true)
    setTextError(null)
    setTextSuccess(false)
    try {
      const result = await savePastedRequirementAction(featureId, projectId, pastedText)
      if (result.error) throw new Error(result.error)
      setPastedText("")
      setTextSuccess(true)
      onRefresh()
      setTimeout(() => setTextSuccess(false), 3000)
    } catch (error: any) {
      setTextError(error.message)
    } finally {
      setTextSaving(false)
    }
  }

  // === Xử lý File Upload API ===
  const handleUploadFile = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("projectId", projectId)
      formData.append("featureId", featureId)
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to upload file")
      }

      onRefresh()
    } catch (error: any) {
      setUploadError(error.message)
    } finally {
      setUploading(false)
    }
  }

  // === Drag and Drop ===
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0])
    }
  }

  // === Remove (Soft Delete) ===
  const handleRemoveSource = async (id: string) => {
    if (confirm("Are you sure you want to exclude this document from AI context?")) {
      await removeInputSourceAction(id, featureId, projectId)
      onRefresh()
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Paste Requirement Text */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base text-foreground">Paste Business Requirements</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Dán mô tả chức năng hoặc rule nghiệp vụ bằng văn bản hoặc Markdown để AI đọc trực tiếp.
        </p>

        {textError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {textError}
          </div>
        )}

        {textSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Requirement text saved successfully!
          </div>
        )}

        <div className="space-y-3">
          <textarea
            rows={6}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={textSaving}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none placeholder-muted-foreground/60"
            placeholder="Dán tài liệu mô tả yêu cầu tính năng tại đây (Ví dụ: Trang login cần kiểm tra định dạng email và mật khẩu tối thiểu 8 ký tự, có mã hóa...)"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveText}
              disabled={textSaving || pastedText.trim().length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/30 disabled:text-primary-foreground/50 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              {textSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Requirement Text
            </button>
          </div>
        </div>
      </div>

      {/* 2. Drag & Drop File Upload */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload box */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-4">
            <h3 className="font-semibold text-base text-foreground">Attach Documents</h3>
            <p className="text-xs text-muted-foreground">
              Đính kèm file tài liệu PRD (.pdf, .docx, .md, .txt) hoặc hình ảnh giao diện Figma (.png, .jpg). Dung lượng tối đa 10MB.
            </p>

            {uploadError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {uploadError}
              </div>
            )}

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5",
                dragActive && "border-primary bg-primary/10",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".md,.txt,.pdf,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileInputChange}
              />
              {uploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
              )}
              <div className="text-center">
                <span className="text-xs font-semibold text-foreground block">
                  {uploading ? "Uploading..." : "Click or drag file to upload"}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  PDF, DOCX, MD, TXT, PNG, JPG up to 10MB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attachment List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground mb-4">Attached Input Sources</h3>
              {activeSources.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-border border-dashed rounded-lg bg-secondary/10">
                  <p className="text-muted-foreground text-xs">No documents attached to this feature workspace yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:border-border/80 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground line-clamp-1">{source.title}</div>
                          <div className="text-[10px] text-muted-foreground space-x-2 mt-0.5">
                            <span className="uppercase">{source.source_type.replace(/_/g, " ")}</span>
                            {source.size_bytes !== undefined && (
                              <span>• {formatBytes(source.size_bytes)}</span>
                            )}
                            <span>• {formatDate(source.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* signedUrl Preview */}
                        {(source as any).signedUrl && (
                          <a
                            href={(source as any).signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="Preview File"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleRemoveSource(source.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-destructive hover:text-destructive/80 transition-colors"
                          title="Exclude Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Link2, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { artifactsApi } from '@/lib/api';
import { useJobStatus } from '@/hooks/useJobStatus';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/ui/JobStatusBadge';
import { cn } from '@/lib/utils';
import type { ArtifactStatus } from '@/types/api';

const SIZE_LIMITS: Record<string, number> = {
  'application/pdf': 30 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 30 * 1024 * 1024,
  'text/plain': 30 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 20 * 1024 * 1024,
  'text/csv': 20 * 1024 * 1024,
  'image/png': 10 * 1024 * 1024,
  'image/jpeg': 10 * 1024 * 1024,
  'image/webp': 10 * 1024 * 1024,
};

const STATUS_CONFIG: Record<ArtifactStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
  UPLOADED: { label: 'Đã tải lên', variant: 'info' },
  PARSING: { label: 'Đang xử lý', variant: 'warning' },
  PARSED: { label: 'Đã xử lý', variant: 'success' },
  FAILED: { label: 'Lỗi', variant: 'danger' },
};

interface Props {
  projectId: string;
  onParsed?: (artifactId: string) => void;
}

type InputMode = 'upload' | 'text' | 'figma';

export function TabInput({ projectId, onParsed }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [parseRunId, setParseRunId] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');

  const { data: artifacts, isLoading: artifactsLoading } = useQuery({
    queryKey: ['artifacts', projectId],
    queryFn: () => artifactsApi.list(projectId),
  });

  const jobStatus = useJobStatus(parseRunId);

  const createAndParseMutation = useMutation({
    mutationFn: async (params: { type: 'DOCUMENT' | 'TEXT' | 'FIGMA'; fileName?: string; mimeType?: string; sizeBytes?: number; sourceText?: string }) => {
      const { type, ...rest } = params;
      const artifact = await artifactsApi.create(projectId, { type, ...rest });
      const run = await artifactsApi.parse(artifact.id);
      return { artifact, run };
    },
    onSuccess: ({ run }) => {
      queryClient.invalidateQueries({ queryKey: ['artifacts', projectId] });
      setParseRunId(run.id);
      if (jobStatus.isSucceeded) onParsed?.(run.id);
    },
  });

  function validateFile(file: File): string | null {
    const limit = SIZE_LIMITS[file.type];
    if (!limit) return `Loại file "${file.type}" không được hỗ trợ.`;
    if (file.size > limit) {
      return `File vượt quá giới hạn (${Math.round(limit / 1024 / 1024)}MB).`;
    }
    return null;
  }

  function handleFile(file: File) {
    const err = validateFile(file);
    if (err) { setFileError(err); return; }
    setFileError('');
    createAndParseMutation.mutate({
      type: file.type.startsWith('image/') ? 'DOCUMENT' : 'DOCUMENT',
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleTextSubmit() {
    if (!pasteText.trim()) return;
    createAndParseMutation.mutate({ type: 'TEXT', sourceText: pasteText });
  }

  function handleFigmaSubmit() {
    if (!figmaUrl.trim()) return;
    createAndParseMutation.mutate({ type: 'FIGMA', sourceText: figmaUrl });
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold mb-1">Nhập yêu cầu</h2>
        <p className="text-xs text-muted-foreground">Tải lên file, dán văn bản hoặc nhập URL Figma</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {([
          { id: 'upload', label: 'Tải file lên', icon: Upload },
          { id: 'text', label: 'Dán văn bản', icon: FileText },
          { id: 'figma', label: 'Figma URL', icon: Link2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors',
              mode === id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted',
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      {mode === 'upload' && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30',
            )}
          >
            <Upload size={24} className="text-muted-foreground" />
            <p className="text-sm font-medium">Kéo thả file vào đây hoặc nhấn để chọn</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, TXT (≤30MB) · XLSX, CSV (≤20MB) · PNG, JPG (≤10MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {fileError && <p className="mt-2 text-xs text-destructive">{fileError}</p>}
        </div>
      )}

      {/* Paste text */}
      {mode === 'text' && (
        <div className="flex flex-col gap-2">
          <textarea
            rows={8}
            placeholder="Dán nội dung yêu cầu vào đây..."
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          <Button
            size="sm"
            onClick={handleTextSubmit}
            disabled={!pasteText.trim()}
            loading={createAndParseMutation.isPending}
          >
            Phân tích văn bản
          </Button>
        </div>
      )}

      {/* Figma URL */}
      {mode === 'figma' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Lỗi Figma chỉ hiển thị cảnh báo — không dừng luồng xử lý.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://www.figma.com/file/..."
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              size="sm"
              onClick={handleFigmaSubmit}
              disabled={!figmaUrl.trim()}
              loading={createAndParseMutation.isPending}
            >
              Import
            </Button>
          </div>
        </div>
      )}

      {/* Parse status */}
      {parseRunId && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái xử lý:</span>
          {jobStatus.run && <JobStatusBadge status={jobStatus.run.status} />}
          {jobStatus.isFailed && (
            <span className="text-xs text-destructive ml-1">{jobStatus.run?.errorReason}</span>
          )}
        </div>
      )}

      {/* Artifact table */}
      {!artifactsLoading && artifacts && artifacts.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">File đã tải lên</h3>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Tên file</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Loại</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {artifacts.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 text-xs">
                      {a.fileName ?? (a.type === 'TEXT' ? 'Văn bản dán' : a.type === 'FIGMA' ? 'Figma' : '—')}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{a.type}</td>
                    <td className="px-3 py-2">
                      <Badge variant={STATUS_CONFIG[a.status].variant}>
                        {STATUS_CONFIG[a.status].label}
                      </Badge>
                      {a.status === 'FAILED' && a.errorReason && (
                        <p className="text-xs text-destructive mt-0.5">{a.errorReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

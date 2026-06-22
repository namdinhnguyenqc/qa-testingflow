'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { requirementsApi } from '@/lib/api';
import { useJobStatus } from '@/hooks/useJobStatus';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/ui/JobStatusBadge';
import type { RequirementItem, Priority, RequirementItemType } from '@/types/api';

const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'info' | 'muted'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'muted',
};

interface Props {
  projectId: string;
  requirementVersionId: string | null;
  artifactId?: string;
}

export function TabAnalyze({ projectId, requirementVersionId, artifactId }: Props) {
  const queryClient = useQueryClient();
  const [analyzeRunId, setAnalyzeRunId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<RequirementItem>>({});

  const jobStatus = useJobStatus(analyzeRunId);

  const { data: version, isLoading } = useQuery({
    queryKey: ['requirement-version', requirementVersionId],
    queryFn: () => requirementsApi.getVersion(requirementVersionId!),
    enabled: !!requirementVersionId,
  });

  const analyzeMutation = useMutation({
    mutationFn: () =>
      requirementsApi.analyze(projectId, { artifactId: artifactId ?? '' }),
    onSuccess: (run) => {
      setAnalyzeRunId(run.id);
    },
  });

  const updateItemsMutation = useMutation({
    mutationFn: (items: RequirementItem[]) =>
      requirementsApi.updateItems(requirementVersionId!, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-version', requirementVersionId] });
      setEditingId(null);
    },
  });

  function saveEdit() {
    if (!version) return;
    const updated = version.items.map((item) =>
      item.id === editingId ? { ...item, ...editDraft } : item,
    );
    updateItemsMutation.mutate(updated as RequirementItem[]);
  }

  function deleteItem(id: string) {
    if (!version) return;
    const updated = version.items.filter((item) => item.id !== id);
    updateItemsMutation.mutate(updated as RequirementItem[]);
  }

  const items = version?.items ?? [];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Phân tích yêu cầu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Xem và chỉnh sửa các item yêu cầu đã được trích xuất</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => analyzeMutation.mutate()}
          loading={analyzeMutation.isPending}
          disabled={!artifactId}
        >
          <RefreshCw size={13} />
          Phân tích lại
        </Button>
      </div>

      {/* Job status */}
      {analyzeRunId && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái phân tích:</span>
          {jobStatus.run && <JobStatusBadge status={jobStatus.run.status} />}
        </div>
      )}

      {/* Quality score */}
      {version?.qualityScore != null && (
        <div className="rounded-lg border bg-white p-4 flex items-start gap-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-primary">{Math.round(version.qualityScore)}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <div>
            <p className="text-sm font-medium">Điểm chất lượng yêu cầu</p>
            {(() => {
              const dims = (version.qualityJson as { dimensions?: { name: string; score: number }[] } | null)?.dimensions;
              if (!dims) return null;
              return (
                <div className="flex flex-wrap gap-2 mt-2">
                  {dims.map((d) => (
                    <span key={d.name} className="text-xs bg-muted rounded px-2 py-0.5">
                      {d.name}: <strong>{String(d.score)}</strong>
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Items table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          {requirementVersionId ? 'Chưa có item nào. Nhấn "Phân tích lại" để bắt đầu.' : 'Chưa có yêu cầu nào được phân tích. Vào tab Đầu vào để tải file lên.'}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">ID</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Module</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Nội dung</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Loại</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Ưu tiên</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Test được</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className={isEditing ? 'bg-primary/5' : 'hover:bg-muted/20'}>
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">{item.externalId}</td>
                    <td className="px-3 py-2 text-xs">
                      {isEditing ? (
                        <input
                          className="h-7 w-24 rounded border border-input px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          value={editDraft.module ?? item.module}
                          onChange={(e) => setEditDraft((d) => ({ ...d, module: e.target.value }))}
                        />
                      ) : item.module}
                    </td>
                    <td className="px-3 py-2 text-xs max-w-xs">
                      {isEditing ? (
                        <textarea
                          className="w-full rounded border border-input px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                          rows={2}
                          value={editDraft.content ?? item.content}
                          onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))}
                        />
                      ) : (
                        <span className="line-clamp-2">{item.content}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{item.type}</td>
                    <td className="px-3 py-2">
                      <Badge variant={PRIORITY_VARIANT[item.priority]}>{item.priority}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {item.testable ? <span className="text-green-600">✓</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><Check size={13} /></button>
                          <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingId(item.id ?? null); setEditDraft({}); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id!)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

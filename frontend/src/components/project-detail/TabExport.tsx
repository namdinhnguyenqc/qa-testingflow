'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { exportsApi } from '@/lib/api';
import { useJobStatus } from '@/hooks/useJobStatus';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/ui/JobStatusBadge';
import type { ExportStatus } from '@/types/api';

const STATUS_VARIANT: Record<ExportStatus, 'success' | 'warning' | 'danger' | 'info' | 'muted'> = {
  QUEUED: 'muted',
  RUNNING: 'info',
  SUCCEEDED: 'success',
  FAILED: 'danger',
};

interface Props {
  projectId: string;
  testcaseSetId: string | null;
}

export function TabExport({ projectId, testcaseSetId }: Props) {
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState<string | null>(null);
  const jobStatus = useJobStatus(runId);

  const { data: exports, isLoading } = useQuery({
    queryKey: ['exports', projectId],
    queryFn: () => exportsApi.list(projectId),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportsApi.exportExcel(testcaseSetId!),
    onSuccess: (run) => {
      setRunId(run.id);
      queryClient.invalidateQueries({ queryKey: ['exports', projectId] });
    },
  });

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Xuất file</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Xuất bộ testcase ra file Excel</p>
        </div>
        <Button
          onClick={() => exportMutation.mutate()}
          loading={exportMutation.isPending}
          disabled={!testcaseSetId}
        >
          <FileSpreadsheet size={14} />
          Xuất Excel
        </Button>
      </div>

      {!testcaseSetId && (
        <div className="rounded-md border border-muted bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Chưa có bộ testcase. Sinh testcase trước khi xuất file.
        </div>
      )}

      {runId && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái xuất:</span>
          {jobStatus.run && <JobStatusBadge status={jobStatus.run.status} />}
          {jobStatus.isFailed && (
            <span className="text-xs text-destructive ml-1">{jobStatus.run?.errorReason}</span>
          )}
        </div>
      )}

      {/* Export history */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lịch sử xuất file</h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
        ) : !exports?.length ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            Chưa có file nào được xuất.
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Tên file</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Định dạng</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Kích thước</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Thời gian</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {exports.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 text-xs">{exp.fileName ?? '—'}</td>
                    <td className="px-3 py-2 text-xs uppercase">{exp.format}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {exp.sizeBytes ? `${Math.round(exp.sizeBytes / 1024)} KB` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={STATUS_VARIANT[exp.status]}>{exp.status}</Badge>
                      {exp.status === 'FAILED' && exp.errorReason && (
                        <p className="text-xs text-destructive mt-0.5">{exp.errorReason}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(exp.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-2">
                      {exp.status === 'SUCCEEDED' && (
                        <a href={exportsApi.downloadUrl(exp.id)} download>
                          <Button size="sm" variant="ghost">
                            <Download size={13} />
                            Tải về
                          </Button>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { coverageApi } from '@/lib/api';
import { useJobStatus } from '@/hooks/useJobStatus';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/ui/JobStatusBadge';
import type { CoverageStatus } from '@/types/api';

const STATUS_CONFIG: Record<CoverageStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
  COVERED: { label: 'Đủ coverage', variant: 'success' },
  PARTIAL: { label: 'Một phần', variant: 'warning' },
  MISSING: { label: 'Thiếu', variant: 'danger' },
  NOT_TESTABLE: { label: 'Không kiểm thử được', variant: 'muted' },
};

interface Props {
  testcaseSetId: string | null;
}

export function TabCoverage({ testcaseSetId }: Props) {
  const [runId, setRunId] = useState<string | null>(null);
  const jobStatus = useJobStatus(runId);

  const { data: coverage, isLoading } = useQuery({
    queryKey: ['coverage', testcaseSetId],
    queryFn: () => coverageApi.get(testcaseSetId!),
    enabled: !!testcaseSetId,
  });

  const checkMutation = useMutation({
    mutationFn: () => coverageApi.check(testcaseSetId!),
    onSuccess: (run) => setRunId(run.id),
  });

  const items = coverage?.items ?? [];
  const countByStatus = (s: CoverageStatus) => items.filter((i) => i.status === s).length;
  const missingCount = countByStatus('MISSING');

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Coverage Matrix</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Mức độ phủ testcase trên các yêu cầu</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => checkMutation.mutate()} loading={checkMutation.isPending} disabled={!testcaseSetId}>
          Kiểm tra lại
        </Button>
      </div>

      {runId && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái:</span>
          {jobStatus.run && <JobStatusBadge status={jobStatus.run.status} />}
        </div>
      )}

      {missingCount > 0 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
          ⚠️ Còn <strong>{missingCount}</strong> yêu cầu chưa có testcase. Sẽ hiển thị cảnh báo khi xuất file.
        </div>
      )}

      {/* Summary cards */}
      {coverage && (
        <div className="grid grid-cols-5 gap-3">
          <div className="rounded-md border bg-white px-3 py-3 col-span-1">
            <p className="text-xs text-muted-foreground">Tổng coverage</p>
            <p className="text-2xl font-bold text-primary mt-1">{Math.round(coverage.coveragePercent)}%</p>
            <p className="text-xs text-muted-foreground">(loại Not Testable)</p>
          </div>
          {(['COVERED', 'PARTIAL', 'MISSING', 'NOT_TESTABLE'] as CoverageStatus[]).map((s) => (
            <div key={s} className="rounded-md border bg-white px-3 py-3">
              <Badge variant={STATUS_CONFIG[s].variant}>{STATUS_CONFIG[s].label}</Badge>
              <p className="text-xl font-bold mt-1">{countByStatus(s)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Items table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
      ) : !testcaseSetId ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Chưa có bộ testcase. Sinh testcase trước.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Nhấn "Kiểm tra lại" để tính coverage.
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">ID Yêu cầu</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Coverage %</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Testcase liên kết</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{item.requirementItemId}</td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_CONFIG[item.status].variant}>{STATUS_CONFIG[item.status].label}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs">{item.coveragePercent != null ? `${Math.round(item.coveragePercent)}%` : '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {item.testcaseRefs?.join(', ') ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requirementsApi, gapsApi } from '@/lib/api';
import { useJobStatus } from '@/hooks/useJobStatus';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/ui/JobStatusBadge';
import { cn } from '@/lib/utils';
import type { GapSeverity, GapStatus } from '@/types/api';

const SEVERITY_VARIANT: Record<GapSeverity, 'danger' | 'warning' | 'info' | 'muted'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'muted',
};

const STATUS_LABEL: Record<GapStatus, string> = {
  OPEN: 'Chưa xử lý',
  RESOLVED: 'Đã giải quyết',
  ACCEPTED_RISK: 'Chấp nhận rủi ro',
  REJECTED: 'Từ chối',
};

interface Props {
  requirementVersionId: string | null;
}

export function TabGapReview({ requirementVersionId }: Props) {
  const queryClient = useQueryClient();
  const [detectRunId, setDetectRunId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<GapSeverity | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<GapStatus | 'ALL'>('ALL');
  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const jobStatus = useJobStatus(detectRunId);

  const { data: gaps, isLoading } = useQuery({
    queryKey: ['gaps', requirementVersionId],
    queryFn: () => requirementsApi.listGaps(requirementVersionId!),
    enabled: !!requirementVersionId,
  });

  const detectMutation = useMutation({
    mutationFn: () => requirementsApi.detectGaps(requirementVersionId!),
    onSuccess: (run) => setDetectRunId(run.id),
  });

  const updateGapMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: GapStatus }) =>
      gapsApi.update(id, { status, resolutionNote: resolutionNote || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gaps', requirementVersionId] });
      setSelectedGap(null);
      setResolutionNote('');
    },
  });

  const filtered = (gaps ?? []).filter((g) => {
    const matchSev = filterSeverity === 'ALL' || g.severity === filterSeverity;
    const matchSt = filterStatus === 'ALL' || g.status === filterStatus;
    return matchSev && matchSt;
  });

  const openCriticalHigh = (gaps ?? []).filter(
    (g) => g.status === 'OPEN' && (g.severity === 'CRITICAL' || g.severity === 'HIGH'),
  ).length;

  const selectedGapData = gaps?.find((g) => g.id === selectedGap);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Kiểm tra Gap</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Xem xét và giải quyết các gap trong yêu cầu</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => detectMutation.mutate()} loading={detectMutation.isPending} disabled={!requirementVersionId}>
          Phát hiện Gap
        </Button>
      </div>

      {detectRunId && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái phát hiện:</span>
          {jobStatus.run && <JobStatusBadge status={jobStatus.run.status} />}
        </div>
      )}

      {openCriticalHigh > 0 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
          ⚠️ Còn <strong>{openCriticalHigh}</strong> gap Critical/High chưa xử lý. Sẽ hiển thị cảnh báo khi duyệt yêu cầu.
        </div>
      )}

      {/* Summary */}
      {gaps && gaps.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as GapSeverity[]).map((sev) => {
            const count = gaps.filter((g) => g.severity === sev).length;
            return (
              <div key={sev} className="rounded-md border bg-white px-3 py-2 text-center">
                <Badge variant={SEVERITY_VARIANT[sev]}>{sev}</Badge>
                <p className="text-lg font-bold mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as GapSeverity | 'ALL')}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">Tất cả mức độ</option>
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as GapSeverity[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as GapStatus | 'ALL')}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {(Object.keys(STATUS_LABEL) as GapStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* Gap table + detail drawer */}
      <div className="flex gap-4">
        <div className={cn('flex-1 rounded-md border overflow-hidden', selectedGap && 'max-w-[60%]')}>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {(gaps ?? []).length === 0 ? 'Chưa phát hiện gap nào.' : 'Không có gap phù hợp với bộ lọc.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Mô tả</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Mức độ</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Trạng thái</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((gap) => (
                  <tr
                    key={gap.id}
                    onClick={() => setSelectedGap(gap.id === selectedGap ? null : gap.id)}
                    className={cn(
                      'cursor-pointer hover:bg-muted/20',
                      gap.id === selectedGap && 'bg-primary/5',
                    )}
                  >
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{gap.externalId}</td>
                    <td className="px-3 py-2 text-xs max-w-xs">
                      <p className="line-clamp-2">{gap.description}</p>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={SEVERITY_VARIANT[gap.severity]}>{gap.severity}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={cn(gap.status === 'OPEN' ? 'text-yellow-600' : 'text-green-600')}>
                        {STATUS_LABEL[gap.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground text-right">
                      {Math.round(gap.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail drawer */}
        {selectedGapData && (
          <div className="w-80 rounded-md border bg-white p-4 flex flex-col gap-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-xs">{selectedGapData.externalId}</p>
                <Badge variant={SEVERITY_VARIANT[selectedGapData.severity]} className="mt-1">{selectedGapData.severity}</Badge>
              </div>
              <button onClick={() => setSelectedGap(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mô tả</p>
              <p className="text-xs mt-1">{selectedGapData.description}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bằng chứng</p>
              <p className="text-xs mt-1 text-muted-foreground">{selectedGapData.evidence}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Ghi chú giải quyết</p>
              <textarea
                rows={3}
                placeholder="Nhập ghi chú..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full rounded border border-input px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {(['RESOLVED', 'ACCEPTED_RISK', 'REJECTED'] as GapStatus[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === 'RESOLVED' ? 'primary' : 'outline'}
                  loading={updateGapMutation.isPending && updateGapMutation.variables?.status === s}
                  onClick={() => updateGapMutation.mutate({ id: selectedGapData.id, status: s })}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

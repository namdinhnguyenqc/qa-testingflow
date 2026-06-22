'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requirementsApi } from '@/lib/api';
import type { ApproveRequest } from '@/types/api';
import { useJobStatus } from '@/hooks/useJobStatus';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/ui/JobStatusBadge';

interface Props {
  requirementVersionId: string | null;
  onApproved?: () => void;
}

export function TabFinalRequirement({ requirementVersionId, onApproved }: Props) {
  const queryClient = useQueryClient();
  const [rewriteRunId, setRewriteRunId] = useState<string | null>(null);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const jobStatus = useJobStatus(rewriteRunId);

  const { data: version } = useQuery({
    queryKey: ['requirement-version', requirementVersionId],
    queryFn: () => requirementsApi.getVersion(requirementVersionId!),
    enabled: !!requirementVersionId,
  });

  const rewriteMutation = useMutation({
    mutationFn: () => requirementsApi.rewrite(requirementVersionId!),
    onSuccess: (run) => setRewriteRunId(run.id),
  });

  const approveMutation = useMutation({
    mutationFn: (opts?: Partial<ApproveRequest>) =>
      requirementsApi.approve(requirementVersionId!, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-version', requirementVersionId] });
      setShowOverrideConfirm(false);
      onApproved?.();
    },
  });

  const isLocked = version?.status === 'LOCKED' || version?.status === 'APPROVED';

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Yêu cầu cuối cùng</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Xem lại, viết lại và duyệt yêu cầu</p>
        </div>
        <div className="flex gap-2">
          {!isLocked && (
            <Button size="sm" variant="outline" onClick={() => rewriteMutation.mutate()} loading={rewriteMutation.isPending}>
              Viết lại
            </Button>
          )}
          {version && !isLocked && (
            <Button
              size="sm"
              onClick={() => {
                const hasOpenCritical = true; // in real: check from gap data
                if (hasOpenCritical) setShowOverrideConfirm(true);
                else approveMutation.mutate({});
              }}
              loading={approveMutation.isPending}
            >
              Duyệt yêu cầu
            </Button>
          )}
        </div>
      </div>

      {rewriteRunId && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái viết lại:</span>
          {jobStatus.run && <JobStatusBadge status={jobStatus.run.status} />}
        </div>
      )}

      {/* Override confirmation */}
      {showOverrideConfirm && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-yellow-800">⚠️ Cảnh báo: Còn gap chưa xử lý</p>
          <p className="text-xs text-yellow-700">Duyệt lúc này sẽ gắn nhãn "Draft with unresolved risk". Nhập lý do để tiếp tục.</p>
          <textarea
            rows={2}
            placeholder="Lý do override..."
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            className="rounded border border-yellow-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => approveMutation.mutate({ override: true, reason: overrideReason })} loading={approveMutation.isPending}>
              Xác nhận duyệt
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowOverrideConfirm(false)}>Hủy</Button>
          </div>
        </div>
      )}

      {/* Version info */}
      {version && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Phiên bản: <strong>v{version.versionNo}</strong></span>
          <Badge
            variant={
              version.status === 'APPROVED' || version.status === 'LOCKED'
                ? 'success'
                : version.status === 'REWRITTEN'
                ? 'info'
                : 'muted'
            }
          >
            {version.status}
          </Badge>
          {version.approvedAt && (
            <span>Duyệt lúc: {new Date(version.approvedAt).toLocaleString('vi-VN')}</span>
          )}
        </div>
      )}

      {/* Content preview */}
      {version?.contentMarkdown ? (
        <div className="rounded-md border bg-white p-4">
          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground">
            {version.contentMarkdown}
          </pre>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Chưa có nội dung. Nhấn "Viết lại" để tạo yêu cầu cuối.
        </div>
      )}
    </div>
  );
}

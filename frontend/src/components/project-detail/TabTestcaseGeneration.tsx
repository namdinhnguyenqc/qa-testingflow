'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { testcasesApi } from '@/lib/api';
import { useJobStatus } from '@/hooks/useJobStatus';
import { Button } from '@/components/ui/Button';
import { JobStatusBadge } from '@/components/ui/JobStatusBadge';
import type { Language } from '@/types/api';

interface Props {
  requirementVersionId: string | null;
  isApproved: boolean;
  onGenerated?: (setId: string) => void;
}

export function TabTestcaseGeneration({ requirementVersionId, isApproved, onGenerated }: Props) {
  const [runId, setRunId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('vi');
  const [detailLevel, setDetailLevel] = useState<'smoke' | 'standard' | 'exhaustive'>('standard');
  const [maxCases, setMaxCases] = useState<string>('');
  const [scope, setScope] = useState('');

  const jobStatus = useJobStatus(runId);

  const generateMutation = useMutation({
    mutationFn: () =>
      testcasesApi.generate(requirementVersionId!, {
        language,
        detailLevel,
        scope: scope || undefined,
        maxCases: maxCases ? parseInt(maxCases) : undefined,
      }),
    onSuccess: (run) => {
      setRunId(run.id);
    },
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-lg">
      <div>
        <h2 className="text-sm font-semibold">Sinh testcase</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Cấu hình tham số và sinh bộ testcase từ yêu cầu đã duyệt</p>
      </div>

      {!isApproved && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
          Yêu cầu chưa được duyệt. Vui lòng duyệt yêu cầu trước khi sinh testcase.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Ngôn ngữ output</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={!isApproved}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Mức độ chi tiết</label>
          <select
            value={detailLevel}
            onChange={(e) => setDetailLevel(e.target.value as 'smoke' | 'standard' | 'exhaustive')}
            disabled={!isApproved}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="smoke">Smoke — nhanh, ít case</option>
            <option value="standard">Standard — cân bằng (mặc định)</option>
            <option value="exhaustive">Exhaustive — toàn diện, nhiều case</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Phạm vi (tùy chọn)</label>
          <input
            type="text"
            placeholder="VD: Chỉ module Đăng nhập"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            disabled={!isApproved}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Số case tối đa (tùy chọn)</label>
          <input
            type="number"
            min={1}
            placeholder="Không giới hạn"
            value={maxCases}
            onChange={(e) => setMaxCases(e.target.value)}
            disabled={!isApproved}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>
      </div>

      <Button
        onClick={() => generateMutation.mutate()}
        loading={generateMutation.isPending}
        disabled={!isApproved}
      >
        Sinh testcase
      </Button>

      {runId && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trạng thái:</span>
          {jobStatus.run && <JobStatusBadge status={jobStatus.run.status} />}
          {jobStatus.isFailed && (
            <span className="text-xs text-destructive ml-1">{jobStatus.run?.errorReason}</span>
          )}
        </div>
      )}
    </div>
  );
}

import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { WorkflowStatus } from '@/types/api';
import { cn } from '@/lib/utils';

const CONFIG: Record<WorkflowStatus, { label: string; icon: React.ElementType; className: string }> = {
  QUEUED: { label: 'Đang chờ', icon: Clock, className: 'text-muted-foreground' },
  RUNNING: { label: 'Đang xử lý', icon: Loader2, className: 'text-blue-600' },
  WAITING_USER: { label: 'Chờ xác nhận', icon: Clock, className: 'text-yellow-600' },
  SUCCEEDED: { label: 'Thành công', icon: CheckCircle2, className: 'text-green-600' },
  FAILED: { label: 'Thất bại', icon: XCircle, className: 'text-destructive' },
  CANCELED: { label: 'Đã hủy', icon: XCircle, className: 'text-muted-foreground' },
};

export function JobStatusBadge({ status }: { status: WorkflowStatus }) {
  const { label, icon: Icon, className } = CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <Icon size={12} className={status === 'RUNNING' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}

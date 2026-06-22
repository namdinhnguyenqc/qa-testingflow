import { useQuery } from '@tanstack/react-query';
import { workflowApi } from '@/lib/api';
import type { WorkflowStatus } from '@/types/api';

const TERMINAL: WorkflowStatus[] = ['SUCCEEDED', 'FAILED', 'CANCELED'];

export function useJobStatus(runId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['workflow-run', runId],
    queryFn: () => workflowApi.get(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL.includes(status)) return false;
      return 2000;
    },
  });

  return {
    run: query.data,
    status: query.data?.status ?? null,
    isRunning: !!query.data && !TERMINAL.includes(query.data.status),
    isSucceeded: query.data?.status === 'SUCCEEDED',
    isFailed: query.data?.status === 'FAILED',
    isCanceled: query.data?.status === 'CANCELED',
    isLoading: query.isLoading,
  };
}

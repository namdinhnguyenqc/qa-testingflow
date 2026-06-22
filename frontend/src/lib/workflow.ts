import { useEffect, useMemo, useState } from "react";
import type { JobStatus, WorkflowRun } from "@/types/domain";

const sequence: JobStatus[] = ["queued", "running", "succeeded"];

export function useWorkflowStatus(workflowKey: string, enabled = false) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 900);

    return () => window.clearInterval(interval);
  }, [enabled, workflowKey]);

  const run = useMemo<WorkflowRun | null>(() => {
    if (!enabled) {
      return null;
    }

    const now = new Date().toISOString();
    return {
      id: `wf-${workflowKey}`,
      traceId: `trace-${workflowKey}`,
      workflowKey,
      status: sequence[Math.min(tick, sequence.length - 1)],
      createdAt: now,
      updatedAt: now,
    };
  }, [enabled, tick, workflowKey]);

  return run;
}

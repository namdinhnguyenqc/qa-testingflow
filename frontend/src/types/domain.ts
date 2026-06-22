export type ProjectStatus = "ACTIVE" | "ARCHIVED";
export type JobStatus = "idle" | "queued" | "running" | "waiting_user" | "succeeded" | "failed";
export type StepKey =
  | "input"
  | "analyze"
  | "gaps"
  | "final"
  | "testcases"
  | "coverage"
  | "export";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  defaultLanguage: "vi" | "en";
  createdAt: string;
  updatedAt: string;
}

export interface RequirementItem {
  externalId: string;
  module: string;
  feature: string;
  type: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  testable: boolean;
  content: string;
}

export interface GapItem {
  id: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "RESOLVED" | "ACCEPTED_RISK" | "REJECTED";
  confidence: number;
  evidence: string;
  description: string;
}

export interface TestCase {
  id: string;
  title: string;
  module: string;
  feature: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;
  status: "DRAFT" | "READY" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
  requirementRefs: string[];
}

export interface WorkflowRun {
  id: string;
  traceId: string;
  workflowKey: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

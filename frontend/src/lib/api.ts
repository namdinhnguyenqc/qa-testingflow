import { apiClient } from './api-client';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  DeleteResponse,
  Artifact,
  CreateArtifactRequest,
  WorkflowRun,
  RequirementVersion,
  RequirementItem,
  GapItem,
  UpdateGapRequest,
  ApproveRequest,
  GenerateTestcasesRequest,
  TestcaseSet,
  UpdateTestCaseRequest,
  TestCase,
  CoverageMatrix,
  ExportArtifact,
  AnalyzeRequirementRequest,
  AuditLog,
  PromptVersion,
  CreatePromptVersionRequest,
  GateConfig,
  UpdateGateConfigRequest,
  BudgetStatus,
  CostSummary,
  AiProviderConnectionResult,
} from '@/types/api';

// Projects
export const projectsApi = {
  list: () => apiClient.get<Project[]>('/projects').then((r) => r.data),
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (body: CreateProjectRequest) =>
    apiClient.post<Project>('/projects', body).then((r) => r.data),
  update: (id: string, body: UpdateProjectRequest) =>
    apiClient.patch<Project>(`/projects/${id}`, body).then((r) => r.data),
  remove: (id: string) =>
    apiClient.delete<DeleteResponse>(`/projects/${id}`).then((r) => r.data),
};

// Artifacts
export const artifactsApi = {
  list: (projectId: string) =>
    apiClient.get<Artifact[]>(`/projects/${projectId}/artifacts`).then((r) => r.data),
  create: (projectId: string, body: CreateArtifactRequest) =>
    apiClient.post<Artifact>(`/projects/${projectId}/artifacts`, body).then((r) => r.data),
  upload: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<Artifact>(`/projects/${projectId}/artifacts/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  parse: (artifactId: string) =>
    apiClient.post<WorkflowRun>(`/artifacts/${artifactId}/parse`).then((r) => r.data),
};

// Requirements
export const requirementsApi = {
  listVersions: (projectId: string) =>
    apiClient.get<RequirementVersion[]>(`/projects/${projectId}/requirement-versions`).then((r) => r.data),
  analyze: (projectId: string, body: AnalyzeRequirementRequest) =>
    apiClient
      .post<WorkflowRun>(`/projects/${projectId}/requirements/analyze`, body)
      .then((r) => r.data),
  autoPipeline: (projectId: string, body: AnalyzeRequirementRequest) =>
    apiClient
      .post<{ requirementVersionId: string; testcaseSetId: string; status: string }>(
        `/projects/${projectId}/requirements/auto-pipeline`,
        body,
      )
      .then((r) => r.data),
  getVersion: (versionId: string) =>
    apiClient.get<RequirementVersion>(`/requirements/versions/${versionId}`).then((r) => r.data),
  updateItems: (versionId: string, items: RequirementItem[]) =>
    apiClient
      .patch<RequirementVersion>(`/requirements/versions/${versionId}/items`, { items })
      .then((r) => r.data),
  checkQuality: (versionId: string) =>
    apiClient
      .post<WorkflowRun>(`/requirements/versions/${versionId}/quality`)
      .then((r) => r.data),
  detectGaps: (versionId: string) =>
    apiClient
      .post<WorkflowRun>(`/requirements/versions/${versionId}/gaps`)
      .then((r) => r.data),
  listGaps: (versionId: string) =>
    apiClient.get<GapItem[]>(`/requirements/versions/${versionId}/gaps`).then((r) => r.data),
  rewrite: (versionId: string) =>
    apiClient
      .post<WorkflowRun>(`/requirements/versions/${versionId}/rewrite`)
      .then((r) => r.data),
  approve: (versionId: string, body?: Partial<ApproveRequest>) =>
    apiClient
      .post<RequirementVersion>(`/requirements/versions/${versionId}/approve`, body)
      .then((r) => r.data),
};

// Gaps
export const gapsApi = {
  update: (gapId: string, body: UpdateGapRequest) =>
    apiClient.patch<GapItem>(`/gaps/${gapId}`, body).then((r) => r.data),
};

// Testcases
export const testcasesApi = {
  generate: (requirementVersionId: string, body: GenerateTestcasesRequest) =>
    apiClient
      .post<WorkflowRun>(`/requirements/versions/${requirementVersionId}/testcase-sets`, body)
      .then((r) => r.data),
  getSet: (setId: string) =>
    apiClient.get<TestcaseSet>(`/testcase-sets/${setId}`).then((r) => r.data),
  updateCase: (caseId: string, body: UpdateTestCaseRequest) =>
    apiClient.patch<TestCase>(`/test-cases/${caseId}`, body).then((r) => r.data),
  deleteCase: (id: string) =>
    apiClient.delete(`/test-cases/${id}`).then((r) => r.data),
};

// Coverage
export const coverageApi = {
  check: (testcaseSetId: string) =>
    apiClient.post<WorkflowRun>(`/testcase-sets/${testcaseSetId}/coverage`).then((r) => r.data),
  get: (testcaseSetId: string) =>
    apiClient
      .get<CoverageMatrix>(`/testcase-sets/${testcaseSetId}/coverage`)
      .then((r) => r.data),
};

// Exports
export const exportsApi = {
  exportExcel: (testcaseSetId: string) =>
    apiClient.post<WorkflowRun>(`/testcase-sets/${testcaseSetId}/exports/excel`).then((r) => r.data),
  list: (projectId: string) =>
    apiClient.get<ExportArtifact[]>(`/projects/${projectId}/exports`).then((r) => r.data),
  downloadUrl: (exportId: string) => `/api/exports/${exportId}/download`,
};

// Workflows
export const workflowApi = {
  get: (runId: string) =>
    apiClient.get<WorkflowRun>(`/workflow-runs/${runId}`).then((r) => r.data),
  retry: (runId: string) =>
    apiClient.post<WorkflowRun>(`/workflow-runs/${runId}/retry`).then((r) => r.data),
  cancel: (runId: string) =>
    apiClient.post<WorkflowRun>(`/workflow-runs/${runId}/cancel`).then((r) => r.data),
};

// Audit
export const auditApi = {
  list: (projectId: string) =>
    apiClient.get<AuditLog[]>(`/projects/${projectId}/audit-logs`).then((r) => r.data),
  listAll: (params?: { projectId?: string; action?: string }) =>
    apiClient.get<AuditLog[]>('/audit-logs', { params }).then((r) => r.data),
};

// ── Phase 2 ────────────────────────────────────────────────────────────────

export const promptsApi = {
  list: (name?: string) =>
    apiClient.get<PromptVersion[]>('/configs/prompt-versions', { params: name ? { name } : {} }).then((r) => r.data),
  create: (body: CreatePromptVersionRequest) =>
    apiClient.post<PromptVersion>('/configs/prompt-versions', body).then((r) => r.data),
  activate: (id: string) =>
    apiClient.post<PromptVersion>(`/configs/prompt-versions/${id}/activate`).then((r) => r.data),
};

export const configsApi = {
  getGate: (projectId: string) =>
    apiClient.get<GateConfig | null>(`/projects/${projectId}/configs/gate`).then((r) => r.data),
  upsertGate: (projectId: string, body: UpdateGateConfigRequest) =>
    apiClient.post<GateConfig>(`/projects/${projectId}/configs/gate`, body).then((r) => r.data),
  getBudgetStatus: (projectId: string) =>
    apiClient.get<BudgetStatus>(`/projects/${projectId}/budget-status`).then((r) => r.data),
  upsertBudget: (projectId: string, body: { hardLimitUsd?: number; warnAtPercent?: number }) =>
    apiClient.post(`/projects/${projectId}/configs/budget`, body).then((r) => r.data),
  getCostSummary: (projectId: string, period?: string) =>
    apiClient.get<CostSummary>(`/projects/${projectId}/cost-summary`, { params: period ? { period } : {} }).then((r) => r.data),
  getGlobalCostSummary: (period?: string) =>
    apiClient.get<CostSummary>('/cost-summary', { params: period ? { period } : {} }).then((r) => r.data),
};

export const aiGatewayApi = {
  testConnection: (providerId: string) =>
    apiClient.post<AiProviderConnectionResult>(`/configs/ai-providers/${providerId}/test-connection`).then((r) => r.data),
};

export const authApi = {
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
};

export const costDashboardApi = {
  getGlobal: (period?: 'day' | 'week' | 'month') =>
    apiClient.get('/cost-dashboard', { params: period ? { period } : {} }).then((r) => r.data),
  getProject: (projectId: string, period?: 'day' | 'week' | 'month') =>
    apiClient.get(`/projects/${projectId}/cost-dashboard`, { params: period ? { period } : {} }).then((r) => r.data),
};

export const promptCompareApi = {
  compare: (idA: string, idB: string) =>
    apiClient.get('/configs/prompt-versions/compare', { params: { idA, idB } }).then((r) => r.data),
};

export const semanticSearchApi = {
  embed: (versionId: string) =>
    apiClient.post(`/requirements/versions/${versionId}/embed`).then((r) => r.data),
  search: (versionId: string, q: string, topK = 10) =>
    apiClient
      .get<{ id: string; externalId: string; module: string; content: string; score: number }[]>(
        `/requirements/versions/${versionId}/search`,
        { params: { q, topK } },
      )
      .then((r) => r.data),
};

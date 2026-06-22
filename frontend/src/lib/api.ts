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
  parse: (artifactId: string) =>
    apiClient.post<WorkflowRun>(`/artifacts/${artifactId}/parse`).then((r) => r.data),
};

// Requirements
export const requirementsApi = {
  analyze: (projectId: string, body: AnalyzeRequirementRequest) =>
    apiClient
      .post<WorkflowRun>(`/projects/${projectId}/requirements/analyze`, body)
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
};

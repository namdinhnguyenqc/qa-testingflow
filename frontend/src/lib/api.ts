import type {
  Artifact,
  GapItem,
  Project,
  RequirementItem,
  RequirementVersion,
  TestCase,
  TestcaseSet,
  WorkflowRun,
} from "@/types/domain";
import {
  gapItems,
  projects as mockProjects,
  requirementItems,
  testCases,
} from "./mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export interface CreateProjectInput {
  name: string;
  description?: string;
  defaultLanguage?: "vi" | "en";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeWorkflow(run: WorkflowRun): WorkflowRun {
  return {
    ...run,
    status: run.status.toLowerCase() as WorkflowRun["status"],
  };
}

function mockWorkflow(workflowKey: string, outputJson: Record<string, unknown>): WorkflowRun {
  const now = new Date().toISOString();
  return {
    id: `wf-${workflowKey}-${Date.now()}`,
    traceId: `trace-${workflowKey}-${Date.now()}`,
    workflowKey,
    status: "succeeded",
    outputJson,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listProjects(): Promise<Project[]> {
  if (USE_MOCKS) {
    return mockProjects;
  }

  return request<Project[]>("/projects");
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  if (USE_MOCKS) {
    const now = new Date().toISOString();
    const project: Project = {
      id: `project-${Date.now()}`,
      name: input.name,
      description: input.description,
      status: "ACTIVE",
      defaultLanguage: input.defaultLanguage ?? "vi",
      createdAt: now,
      updatedAt: now,
    };
    mockProjects.unshift(project);
    return project;
  }

  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProject(id: string): Promise<Project> {
  if (USE_MOCKS) {
    const project = mockProjects.find((item) => item.id === id);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  }

  return request<Project>(`/projects/${id}`);
}

export async function createTextArtifact(projectId: string, sourceText: string): Promise<Artifact> {
  if (USE_MOCKS) {
    return {
      id: `artifact-${Date.now()}`,
      projectId,
      type: "TEXT",
      status: "UPLOADED",
      fileName: "pasted-requirement.txt",
      sourceText,
    };
  }

  return request<Artifact>(`/projects/${projectId}/artifacts`, {
    method: "POST",
    body: JSON.stringify({
      type: "TEXT",
      fileName: "pasted-requirement.txt",
      mimeType: "text/plain",
      sourceText,
    }),
  });
}

export async function parseArtifact(artifactId: string): Promise<WorkflowRun> {
  if (USE_MOCKS) {
    return normalizeWorkflow(mockWorkflow("artifact_parse", { artifactId }));
  }

  return request<WorkflowRun>(`/artifacts/${artifactId}/parse`, { method: "POST" }).then(normalizeWorkflow);
}

export async function analyzeRequirements(projectId: string, artifactId: string): Promise<WorkflowRun> {
  if (USE_MOCKS) {
    return normalizeWorkflow(mockWorkflow("requirement_analysis", { requirementVersionId: "requirement-version-local" }));
  }

  return request<WorkflowRun>(`/projects/${projectId}/requirements/analyze`, {
    method: "POST",
    body: JSON.stringify({ artifactId, language: "vi" }),
  }).then(normalizeWorkflow);
}

export async function getRequirementVersion(id: string): Promise<RequirementVersion> {
  if (USE_MOCKS) {
    return {
      id,
      projectId: "seed-project-local",
      versionNo: 1,
      status: "ANALYZED",
      qualityScore: 84,
      contentMarkdown: "# Final Requirement",
      items: requirementItems as RequirementItem[],
      gaps: gapItems as GapItem[],
    };
  }

  return request<RequirementVersion>(`/requirements/versions/${id}`);
}

export async function detectGaps(requirementVersionId: string): Promise<WorkflowRun> {
  if (USE_MOCKS) {
    return normalizeWorkflow(mockWorkflow("gap_detection", { requirementVersionId }));
  }

  return request<WorkflowRun>(`/requirements/versions/${requirementVersionId}/gaps`, { method: "POST" }).then(
    normalizeWorkflow,
  );
}

export async function rewriteRequirement(requirementVersionId: string): Promise<WorkflowRun> {
  if (USE_MOCKS) {
    return normalizeWorkflow(mockWorkflow("requirement_rewrite", { requirementVersionId }));
  }

  return request<WorkflowRun>(`/requirements/versions/${requirementVersionId}/rewrite`, { method: "POST" }).then(
    normalizeWorkflow,
  );
}

export async function approveRequirement(requirementVersionId: string): Promise<RequirementVersion> {
  if (USE_MOCKS) {
    return getRequirementVersion(requirementVersionId);
  }

  return request<RequirementVersion>(`/requirements/versions/${requirementVersionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ override: true, reason: "Phase 1 QA override" }),
  });
}

export async function generateTestcases(requirementVersionId: string): Promise<WorkflowRun> {
  if (USE_MOCKS) {
    return normalizeWorkflow(mockWorkflow("testcase_generation", { testcaseSetId: "testcase-set-local" }));
  }

  return request<WorkflowRun>(`/requirements/versions/${requirementVersionId}/testcase-sets`, {
    method: "POST",
    body: JSON.stringify({ language: "vi", detailLevel: "standard", maxCases: 20 }),
  }).then(normalizeWorkflow);
}

export async function getTestcaseSet(id: string): Promise<TestcaseSet> {
  if (USE_MOCKS) {
    return {
      id,
      projectId: "seed-project-local",
      requirementVersionId: "requirement-version-local",
      versionNo: 1,
      status: "GENERATED",
      testCases: testCases as TestCase[],
    };
  }

  return request<TestcaseSet>(`/testcase-sets/${id}`);
}

export async function checkCoverage(testcaseSetId: string): Promise<WorkflowRun> {
  if (USE_MOCKS) {
    return normalizeWorkflow(mockWorkflow("coverage_check", { testcaseSetId }));
  }

  return request<WorkflowRun>(`/testcase-sets/${testcaseSetId}/coverage`, { method: "POST" }).then(normalizeWorkflow);
}

export async function exportExcel(testcaseSetId: string): Promise<WorkflowRun> {
  if (USE_MOCKS) {
    return normalizeWorkflow(mockWorkflow("excel_export", { exportArtifactId: "export-local" }));
  }

  return request<WorkflowRun>(`/testcase-sets/${testcaseSetId}/exports/excel`, { method: "POST" }).then(
    normalizeWorkflow,
  );
}

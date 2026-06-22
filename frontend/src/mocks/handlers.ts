import { http, HttpResponse, delay } from 'msw';
import {
  mockProjects,
  mockWorkflowRun,
  mockRequirementVersion,
  mockGaps,
  mockTestcaseSet,
  mockExports,
} from './data';

const BASE = 'http://localhost:3000/api';

let projects = [...mockProjects];
let idCounter = 10;

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email && body.password) {
      return HttpResponse.json({ token: 'mock-token', user: { email: body.email } });
    }
    return HttpResponse.json({ message: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
  }),

  // Projects
  http.get(`${BASE}/projects`, async () => {
    await delay(300);
    return HttpResponse.json(projects);
  }),

  http.post(`${BASE}/projects`, async ({ request }) => {
    await delay(400);
    const body = await request.json() as Record<string, unknown>;
    const project = {
      id: `proj-${++idCounter}`,
      name: body.name as string,
      description: (body.description as string) ?? null,
      status: 'ACTIVE' as const,
      defaultLanguage: (body.defaultLanguage as 'vi' | 'en') ?? 'vi',
      configOverrides: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects = [...projects, project];
    return HttpResponse.json(project, { status: 201 });
  }),

  http.get(`${BASE}/projects/:id`, async ({ params }) => {
    await delay(200);
    const p = projects.find((x) => x.id === params.id);
    if (!p) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(p);
  }),

  http.patch(`${BASE}/projects/:id`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as Record<string, unknown>;
    const idx = projects.findIndex((x) => x.id === params.id);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    projects[idx] = { ...projects[idx], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json(projects[idx]);
  }),

  http.delete(`${BASE}/projects/:id`, async ({ params }) => {
    await delay(300);
    projects = projects.filter((x) => x.id !== params.id);
    return HttpResponse.json({ deleted: true, id: params.id });
  }),

  // Artifacts
  http.get(`${BASE}/projects/:projectId/artifacts`, async () => {
    await delay(200);
    return HttpResponse.json([]);
  }),

  http.post(`${BASE}/projects/:projectId/artifacts`, async () => {
    await delay(400);
    return HttpResponse.json(
      { id: 'art-001', projectId: 'proj-001', type: 'DOCUMENT', status: 'UPLOADED',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/artifacts/:id/parse`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'parse_artifact' }, { status: 202 });
  }),

  // Workflow runs
  http.get(`${BASE}/workflow-runs/:id`, async ({ params }) => {
    await delay(500);
    return HttpResponse.json({ ...mockWorkflowRun, id: params.id as string, status: 'SUCCEEDED' });
  }),

  http.post(`${BASE}/workflow-runs/:id/retry`, async () => {
    await delay(200);
    return HttpResponse.json({ ...mockWorkflowRun, status: 'QUEUED' }, { status: 202 });
  }),

  http.post(`${BASE}/workflow-runs/:id/cancel`, async () => {
    await delay(200);
    return HttpResponse.json({ ...mockWorkflowRun, status: 'CANCELED' });
  }),

  // Requirements
  http.post(`${BASE}/projects/:projectId/requirements/analyze`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'analyze_requirement' }, { status: 202 });
  }),

  http.get(`${BASE}/requirements/versions/:id`, async () => {
    await delay(300);
    return HttpResponse.json(mockRequirementVersion);
  }),

  http.patch(`${BASE}/requirements/versions/:id/items`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as { items: unknown[] };
    return HttpResponse.json({ ...mockRequirementVersion, items: body.items });
  }),

  http.post(`${BASE}/requirements/versions/:id/quality`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'quality_check' }, { status: 202 });
  }),

  http.post(`${BASE}/requirements/versions/:id/gaps`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'gap_detection' }, { status: 202 });
  }),

  http.get(`${BASE}/requirements/versions/:id/gaps`, async () => {
    await delay(300);
    return HttpResponse.json(mockGaps);
  }),

  http.post(`${BASE}/requirements/versions/:id/rewrite`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'rewrite' }, { status: 202 });
  }),

  http.post(`${BASE}/requirements/versions/:id/approve`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockRequirementVersion, status: 'APPROVED', approvedAt: new Date().toISOString() });
  }),

  // Gaps
  http.patch(`${BASE}/gaps/:id`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as Record<string, unknown>;
    const gap = mockGaps.find((g) => g.id === params.id);
    if (!gap) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ ...gap, ...body, updatedAt: new Date().toISOString() });
  }),

  // Testcases
  http.post(`${BASE}/requirements/versions/:id/testcase-sets`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'generate_testcases' }, { status: 202 });
  }),

  http.get(`${BASE}/testcase-sets/:id`, async () => {
    await delay(300);
    return HttpResponse.json(mockTestcaseSet);
  }),

  http.patch(`${BASE}/test-cases/:id`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as Record<string, unknown>;
    const tc = mockTestcaseSet.testCases.find((t) => t.id === params.id);
    if (!tc) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ ...tc, ...body, updatedAt: new Date().toISOString() });
  }),

  // Coverage
  http.post(`${BASE}/testcase-sets/:id/coverage`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'coverage_check' }, { status: 202 });
  }),

  http.get(`${BASE}/testcase-sets/:id/coverage`, async () => {
    await delay(300);
    return HttpResponse.json({
      coveragePercent: 66.7,
      items: [
        { id: 'cov-001', requirementItemId: 'ri-001', testcaseSetId: 'tcs-001', status: 'COVERED', coveragePercent: 100, testcaseRefs: ['tc-001', 'tc-002'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'cov-002', requirementItemId: 'ri-002', testcaseSetId: 'tcs-001', status: 'COVERED', coveragePercent: 100, testcaseRefs: ['tc-003'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'cov-003', requirementItemId: 'ri-003', testcaseSetId: 'tcs-001', status: 'MISSING', coveragePercent: 0, testcaseRefs: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
    });
  }),

  // Exports
  http.post(`${BASE}/testcase-sets/:id/exports/excel`, async () => {
    await delay(300);
    return HttpResponse.json({ ...mockWorkflowRun, workflowKey: 'export_excel' }, { status: 202 });
  }),

  http.get(`${BASE}/projects/:projectId/exports`, async () => {
    await delay(200);
    return HttpResponse.json(mockExports);
  }),

  // Audit logs
  http.get(`${BASE}/projects/:projectId/audit-logs`, async () => {
    await delay(200);
    return HttpResponse.json([]);
  }),

  // AI provider
  http.post(`${BASE}/configs/ai-providers/:id/test-connection`, async () => {
    await delay(800);
    return HttpResponse.json({ ok: true, provider: 'openai', models: ['gpt-4o', 'gpt-4o-mini'], secretRef: 'env:...KEY' });
  }),
];

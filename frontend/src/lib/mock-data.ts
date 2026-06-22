import type { GapItem, Project, RequirementItem, TestCase, WorkflowRun } from "@/types/domain";

export const projects: Project[] = [
  {
    id: "seed-project-local",
    name: "Local QA Demo",
    description: "Requirement analysis and testcase generation demo",
    status: "ACTIVE",
    defaultLanguage: "vi",
    createdAt: "2026-06-22T02:40:00.000Z",
    updatedAt: "2026-06-22T02:40:00.000Z",
  },
];

export const requirementItems: RequirementItem[] = [
  {
    externalId: "REQ_AUTH_001",
    module: "Auth",
    feature: "Login",
    type: "FUNCTIONAL",
    priority: "HIGH",
    testable: true,
    content: "User can sign in with valid email and password.",
  },
  {
    externalId: "REQ_AUTH_002",
    module: "Auth",
    feature: "Validation",
    type: "BUSINESS_RULE",
    priority: "MEDIUM",
    testable: true,
    content: "Invalid credentials return a clear error without exposing account state.",
  },
  {
    externalId: "REQ_EXPORT_001",
    module: "Export",
    feature: "Excel",
    type: "FUNCTIONAL",
    priority: "MEDIUM",
    testable: true,
    content: "Approved testcase sets can be exported to Excel with traceable requirement refs.",
  },
];

export const gapItems: GapItem[] = [
  {
    id: "GAP_AUTH_001",
    category: "missing_error_state",
    severity: "HIGH",
    status: "OPEN",
    confidence: 0.86,
    evidence: "Password reset edge cases are not described.",
    description: "Missing behavior for expired reset tokens and repeated reset attempts.",
  },
  {
    id: "GAP_EXPORT_001",
    category: "data_gap",
    severity: "MEDIUM",
    status: "RESOLVED",
    confidence: 0.74,
    evidence: "Excel template lists required columns but not formatting rules.",
    description: "Clarify export date format and multiline step rendering.",
  },
];

export const testCases: TestCase[] = [
  {
    id: "TC_AUTH_LOGIN_001",
    title: "Xác minh đăng nhập thành công với thông tin hợp lệ",
    module: "Auth",
    feature: "Login",
    priority: "HIGH",
    type: "positive",
    status: "READY",
    requirementRefs: ["REQ_AUTH_001"],
  },
  {
    id: "TC_AUTH_LOGIN_002",
    title: "Xác minh lỗi khi nhập sai mật khẩu",
    module: "Auth",
    feature: "Login",
    priority: "MEDIUM",
    type: "negative",
    status: "DRAFT",
    requirementRefs: ["REQ_AUTH_002"],
  },
  {
    id: "TC_EXPORT_EXCEL_001",
    title: "Xác minh export Excel cho bộ testcase đã duyệt",
    module: "Export",
    feature: "Excel",
    priority: "MEDIUM",
    type: "positive",
    status: "NEEDS_REVIEW",
    requirementRefs: ["REQ_EXPORT_001"],
  },
];

export const workflowRuns: WorkflowRun[] = [
  {
    id: "wf-analyze-demo",
    traceId: "trace-demo-001",
    workflowKey: "requirement_analysis",
    status: "succeeded",
    createdAt: "2026-06-22T02:45:00.000Z",
    updatedAt: "2026-06-22T02:46:20.000Z",
  },
];

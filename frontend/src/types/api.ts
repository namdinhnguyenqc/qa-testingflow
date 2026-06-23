// Generated from /contracts/openapi.yaml — do not hand-edit schema shapes

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';
export type Language = 'vi' | 'en';
export type ArtifactType = 'DOCUMENT' | 'SPREADSHEET' | 'IMAGE' | 'TEXT' | 'FIGMA';
export type ArtifactStatus = 'UPLOADED' | 'PARSING' | 'PARSED' | 'FAILED';
export type WorkflowStatus = 'QUEUED' | 'RUNNING' | 'WAITING_USER' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
export type GapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type GapStatus = 'OPEN' | 'RESOLVED' | 'ACCEPTED_RISK' | 'REJECTED';
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RequirementItemType = 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS_RULE' | 'UI' | 'DATA' | 'INTEGRATION' | 'OTHER';
export type RequirementVersionStatus = 'DRAFT' | 'ANALYZED' | 'REWRITTEN' | 'APPROVED' | 'LOCKED';
export type TestcaseStatus = 'DRAFT' | 'READY' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
export type TestcaseSetStatus = 'DRAFT' | 'GENERATED' | 'NEEDS_REVIEW' | 'APPROVED';
export type CoverageStatus = 'COVERED' | 'PARTIAL' | 'MISSING' | 'NOT_TESTABLE';
export type ExportStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  defaultLanguage: Language;
  configOverrides?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  defaultLanguage?: Language;
  configOverrides?: Record<string, unknown>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  defaultLanguage?: Language;
  configOverrides?: Record<string, unknown>;
}

export interface DeleteResponse {
  deleted: boolean;
  id: string;
}

export interface Artifact {
  id: string;
  projectId: string;
  type: ArtifactType;
  status: ArtifactStatus;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  sourceText?: string | null;
  parsedContent?: unknown | null;
  errorReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtifactRequest {
  type: ArtifactType;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  storageKey?: string;
  sourceText?: string;
  parsedContent?: unknown;
}

export interface WorkflowRun {
  id: string;
  projectId: string;
  traceId: string;
  workflowKey: string;
  status: WorkflowStatus;
  inputJson?: unknown;
  outputJson?: unknown;
  errorReason?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementItem {
  id?: string;
  externalId: string;
  module: string;
  feature: string;
  type: RequirementItemType;
  priority: Priority;
  testable: boolean;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface RequirementVersion {
  id: string;
  projectId: string;
  versionNo: number;
  status: RequirementVersionStatus;
  qualityScore?: number | null;
  qualityJson?: unknown | null;
  contentJson: unknown;
  contentMarkdown?: string | null;
  approvedAt?: string | null;
  lockedAt?: string | null;
  items: RequirementItem[];
  testcaseSets?: { id: string; versionNo: number; status: TestcaseSetStatus; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface GapItem {
  id: string;
  externalId: string;
  category: string;
  severity: GapSeverity;
  status: GapStatus;
  confidence: number;
  evidence: string;
  description: string;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGapRequest {
  status?: GapStatus;
  resolutionNote?: string;
}

export interface ApproveRequest {
  override?: boolean;
  reason?: string;
}

export interface GenerateTestcasesRequest {
  language?: Language;
  scope?: string;
  detailLevel?: 'smoke' | 'standard' | 'exhaustive';
  maxCases?: number;
}

export interface TestCase {
  id: string;
  externalId: string;
  module?: string | null;
  feature?: string | null;
  title: string;
  preconditions?: string | null;
  steps: string[];
  expectedResult: string;
  priority: Priority;
  type: string;
  status: TestcaseStatus;
  requirementRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TestcaseSet {
  id: string;
  projectId: string;
  requirementVersionId: string;
  versionNo: number;
  status: TestcaseSetStatus;
  generationConfig?: GenerateTestcasesRequest | null;
  approvedAt?: string | null;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTestCaseRequest {
  title?: string;
  preconditions?: string;
  steps?: string[];
  expectedResult?: string;
  priority?: Priority;
  status?: TestcaseStatus;
}

export interface CoverageItem {
  id: string;
  requirementItemId: string;
  testcaseSetId: string;
  status: CoverageStatus;
  coveragePercent?: number | null;
  testcaseRefs?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoverageMatrix {
  coveragePercent: number;
  items: CoverageItem[];
}

export interface ExportArtifact {
  id: string;
  projectId: string;
  testcaseSetId?: string | null;
  format: string;
  status: ExportStatus;
  fileName?: string | null;
  sizeBytes?: number | null;
  errorReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestAiProviderConnectionResponse {
  ok: boolean;
  provider: string;
  models: string[];
  secretRef: string | null;
}

export interface AnalyzeRequirementRequest {
  artifactId: string;
  language?: Language;
}

export interface AuditLog {
  id: string;
  projectId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown | null;
  createdAt: string;
}

// ── Phase 2 types ──────────────────────────────────────────────────────────

export interface PromptVersion {
  id: string;
  name: string;
  versionNo: number;
  isActive: boolean;
  content: string;
  variables?: unknown | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptVersionRequest {
  name: string;
  content: string;
  variables?: Record<string, string>;
  notes?: string;
}

export interface GateConfig {
  id: string;
  projectId?: string | null;
  name: string;
  contentJson: { minQualityScore: number; blockIfOpenGaps: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGateConfigRequest {
  minQualityScore?: number;
  blockIfOpenGaps?: boolean;
}

export interface BudgetStatus {
  projectId: string;
  budgetUsd: number;
  spentUsd: number;
  usagePercent: number;
  warning: boolean;
  exceeded: boolean;
}

export interface CostSummaryBreakdown {
  provider: string;
  model: string;
  calls: number;
  totalTokens: number;
  costUsd: number;
  errors: number;
}

export interface CostSummary {
  projectId: string;
  period: string;
  since: string;
  totalCostUsd: number;
  totalCalls: number;
  breakdown: CostSummaryBreakdown[];
}

export interface AiProviderConnectionResult {
  ok: boolean;
  provider: string;
  models: string[];
  secretRef: string | null;
}

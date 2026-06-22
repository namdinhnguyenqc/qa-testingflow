import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../node_modules/.prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyzeRequirementDto,
  ApproveDto,
  CreateArtifactDto,
  GenerateTestcasesDto,
  UpdateGapDto,
  UpdateTestCaseDto,
} from './dto';

@Injectable()
export class Phase1Service {
  constructor(private readonly prisma: PrismaService) {}

  createArtifact(projectId: string, dto: CreateArtifactDto) {
    return this.prisma.artifact.create({
      data: {
        projectId,
        type: dto.type,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        storageKey: dto.storageKey,
        sourceText: dto.sourceText,
        parsedContent: dto.parsedContent as Prisma.InputJsonValue,
      },
    });
  }

  listArtifacts(projectId: string) {
    return this.prisma.artifact.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async parseArtifact(id: string) {
    const artifact = await this.prisma.artifact.findUnique({ where: { id } });
    if (!artifact) throw new NotFoundException(`Artifact ${id} was not found`);

    const parsedContent = {
      text:
        artifact.sourceText ??
        'User can login, recover password, generate test cases, review coverage, and export Excel.',
      parser: 'phase1_demo_parser',
    };

    await this.prisma.artifact.update({
      where: { id },
      data: {
        status: 'PARSED',
        parsedContent,
      },
    });

    return this.createWorkflowRun(artifact.projectId, 'artifact_parse', {
      artifactId: id,
      parsedContent,
    });
  }

  async analyzeRequirement(projectId: string, dto: AnalyzeRequirementDto) {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id: dto.artifactId },
    });
    if (!artifact) {
      throw new NotFoundException(`Artifact ${dto.artifactId} was not found`);
    }

    const versionNo =
      (await this.prisma.requirementVersion.count({ where: { projectId } })) +
      1;
    const requirementVersion = await this.prisma.requirementVersion.create({
      data: {
        projectId,
        sourceArtifactId: artifact.id,
        versionNo,
        status: 'ANALYZED',
        qualityScore: 84,
        qualityJson: this.qualityJson(),
        contentJson: this.requirementJson(dto.language ?? 'vi'),
        contentMarkdown: this.requirementMarkdown(),
      },
    });

    await this.prisma.requirementItem.createMany({
      data: this.requirementItems(requirementVersion.id),
    });

    const output = { requirementVersionId: requirementVersion.id };
    await this.createAiCallLog(projectId, 'requirement_reader', 'SUCCEEDED');
    return this.createWorkflowRun(projectId, 'requirement_analysis', output);
  }

  async getRequirementVersion(id: string) {
    const version = await this.prisma.requirementVersion.findUnique({
      where: { id },
      include: { items: true, gaps: true },
    });
    if (!version)
      throw new NotFoundException(`Requirement version ${id} was not found`);
    return version;
  }

  async updateRequirementItems(id: string, body: { items?: unknown[] }) {
    await this.getRequirementVersion(id);
    await this.prisma.requirementItem.deleteMany({
      where: { requirementVersionId: id },
    });
    await this.prisma.requirementItem.createMany({
      data: (body.items ?? []).map((item, index) => {
        const value = item as Record<string, unknown>;
        return {
          requirementVersionId: id,
          externalId: this.asString(
            value.externalId,
            `REQ_EDIT_${String(index + 1).padStart(3, '0')}`,
          ),
          module: this.asString(value.module, 'General'),
          feature: this.asString(value.feature, 'Requirement'),
          type: 'FUNCTIONAL' as const,
          priority: 'MEDIUM' as const,
          testable: Boolean(value.testable ?? true),
          content: this.asString(value.content, ''),
          metadata: value.metadata ?? {},
        };
      }),
    });
    return this.getRequirementVersion(id);
  }
  async queueQuality(id: string) {
    const version = await this.getRequirementVersion(id);
    await this.prisma.requirementVersion.update({
      where: { id },
      data: {
        qualityScore: 84,
        qualityJson: this.qualityJson(),
      },
    });
    await this.createAiCallLog(
      version.projectId,
      'requirement_quality_checker',
      'SUCCEEDED',
    );
    return this.createWorkflowRun(version.projectId, 'requirement_quality', {
      requirementVersionId: id,
    });
  }

  async detectGaps(id: string) {
    const version = await this.getRequirementVersion(id);
    const items = await this.prisma.requirementItem.findMany({
      where: { requirementVersionId: id },
      orderBy: { createdAt: 'asc' },
    });

    for (const gap of this.gapItems(version.projectId, id, items[0]?.id)) {
      await this.prisma.gapItem.upsert({
        where: {
          requirementVersionId_externalId: {
            requirementVersionId: id,
            externalId: gap.externalId,
          },
        },
        update: gap,
        create: gap,
      });
    }

    await this.createAiCallLog(version.projectId, 'gap_detector', 'SUCCEEDED');
    return this.createWorkflowRun(version.projectId, 'gap_detection', {
      requirementVersionId: id,
    });
  }

  listGaps(id: string) {
    return this.prisma.gapItem.findMany({
      where: { requirementVersionId: id },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });
  }

  updateGap(id: string, dto: UpdateGapDto) {
    return this.prisma.gapItem.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote,
      },
    });
  }

  async rewriteRequirement(id: string) {
    const version = await this.getRequirementVersion(id);
    const nextVersionNo =
      (await this.prisma.requirementVersion.count({
        where: { projectId: version.projectId },
      })) + 1;
    const rewritten = await this.prisma.requirementVersion.create({
      data: {
        projectId: version.projectId,
        sourceArtifactId: version.sourceArtifactId,
        versionNo: nextVersionNo,
        status: 'REWRITTEN',
        qualityScore: 90,
        qualityJson: this.qualityJson(90),
        contentJson: version.contentJson as Prisma.InputJsonValue,
        contentMarkdown: `${version.contentMarkdown ?? this.requirementMarkdown()}\n\nRisk note: unresolved gaps require QA approval override.`,
      },
    });
    const items = await this.prisma.requirementItem.findMany({
      where: { requirementVersionId: id },
    });
    await this.prisma.requirementItem.createMany({
      data: items.map((item) => ({
        requirementVersionId: rewritten.id,
        externalId: item.externalId,
        module: item.module,
        feature: item.feature,
        type: item.type,
        priority: item.priority,
        testable: item.testable,
        content: item.content,
        metadata: item.metadata as Prisma.InputJsonValue,
      })),
    });
    await this.createAiCallLog(
      version.projectId,
      'requirement_rewriter',
      'SUCCEEDED',
    );
    return this.createWorkflowRun(version.projectId, 'requirement_rewrite', {
      requirementVersionId: rewritten.id,
    });
  }

  async approveRequirement(id: string, dto: ApproveDto) {
    await this.getRequirementVersion(id);
    const openGaps = await this.prisma.gapItem.count({
      where: { requirementVersionId: id, status: 'OPEN' },
    });
    const approved = await this.prisma.requirementVersion.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        lockedAt: new Date(),
      },
    });
    return {
      ...approved,
      gate: {
        passed: openGaps === 0,
        override: Boolean(dto.override),
        label: openGaps > 0 ? 'Draft with unresolved risk' : 'Approved',
      },
    };
  }

  async generateTestcases(id: string, dto: GenerateTestcasesDto) {
    const version = await this.getRequirementVersion(id);
    const setVersionNo =
      (await this.prisma.testcaseSet.count({
        where: { projectId: version.projectId, requirementVersionId: id },
      })) + 1;
    const testcaseSet = await this.prisma.testcaseSet.create({
      data: {
        projectId: version.projectId,
        requirementVersionId: id,
        versionNo: setVersionNo,
        status: 'GENERATED',
        generationConfig: dto as Prisma.InputJsonValue,
      },
    });
    await this.prisma.testCase.createMany({
      data: this.testCases(testcaseSet.id),
    });
    await this.createAiCallLog(
      version.projectId,
      'testcase_generator',
      'SUCCEEDED',
    );
    return this.createWorkflowRun(version.projectId, 'testcase_generation', {
      testcaseSetId: testcaseSet.id,
    });
  }

  async getTestcaseSet(id: string) {
    const set = await this.prisma.testcaseSet.findUnique({
      where: { id },
      include: { testCases: true, coverageItems: true, exports: true },
    });
    if (!set) throw new NotFoundException(`Testcase set ${id} was not found`);
    return set;
  }

  updateTestCase(id: string, dto: UpdateTestCaseDto) {
    return this.prisma.testCase.update({
      where: { id },
      data: {
        title: dto.title,
        preconditions: dto.preconditions,
        steps: dto.steps as Prisma.InputJsonValue,
        expectedResult: dto.expectedResult,
        priority: dto.priority,
        status: dto.status,
      },
    });
  }

  async checkCoverage(id: string) {
    const set = await this.getTestcaseSet(id);
    const items = await this.prisma.requirementItem.findMany({
      where: { requirementVersionId: set.requirementVersionId },
      orderBy: { createdAt: 'asc' },
    });
    for (const [index, item] of items.entries()) {
      await this.prisma.coverageItem.upsert({
        where: {
          requirementItemId_testcaseSetId: {
            requirementItemId: item.id,
            testcaseSetId: id,
          },
        },
        update: {
          status: index < 2 ? 'COVERED' : 'PARTIAL',
          coveragePercent: index < 2 ? 100 : 50,
          testcaseRefs: ['TC_AUTH_LOGIN_001'] as Prisma.InputJsonValue,
        },
        create: {
          requirementVersionId: set.requirementVersionId,
          requirementItemId: item.id,
          testcaseSetId: id,
          status: index < 2 ? 'COVERED' : 'PARTIAL',
          coveragePercent: index < 2 ? 100 : 50,
          testcaseRefs: ['TC_AUTH_LOGIN_001'] as Prisma.InputJsonValue,
        },
      });
    }
    await this.createAiCallLog(set.projectId, 'coverage_checker', 'SUCCEEDED');
    return this.createWorkflowRun(set.projectId, 'coverage_check', {
      testcaseSetId: id,
    });
  }

  async getCoverage(id: string) {
    const items = await this.prisma.coverageItem.findMany({
      where: { testcaseSetId: id },
      include: { requirementItem: true },
    });
    const denominator = items.filter(
      (item) => item.status !== 'NOT_TESTABLE',
    ).length;
    const covered = items.filter((item) => item.status === 'COVERED').length;
    return {
      coveragePercent:
        denominator === 0 ? 0 : Math.round((covered / denominator) * 100),
      denominatorPolicy: 'exclude_not_testable',
      items,
    };
  }

  async exportExcel(id: string) {
    const set = await this.getTestcaseSet(id);
    const exportArtifact = await this.prisma.exportArtifact.create({
      data: {
        projectId: set.projectId,
        testcaseSetId: id,
        format: 'xlsx',
        status: 'SUCCEEDED',
        fileName: `testcases-${set.versionNo}.xlsx`,
        storageKey: `exports/${set.id}/testcases-${set.versionNo}.xlsx`,
        sizeBytes: 8192,
      },
    });
    return this.createWorkflowRun(set.projectId, 'excel_export', {
      exportArtifactId: exportArtifact.id,
    });
  }

  listExports(projectId: string) {
    return this.prisma.exportArtifact.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async downloadExport(id: string) {
    const exportArtifact = await this.prisma.exportArtifact.findUnique({
      where: { id },
    });
    if (!exportArtifact)
      throw new NotFoundException(`Export ${id} was not found`);
    return {
      url: `/api/exports/${id}/download/mock-file`,
      fileName: exportArtifact.fileName,
    };
  }

  getWorkflowRun(id: string) {
    return this.prisma.workflowRun.findUniqueOrThrow({ where: { id } });
  }

  retryWorkflowRun(id: string) {
    return this.prisma.workflowRun.update({
      where: { id },
      data: { status: 'QUEUED', errorReason: null, finishedAt: null },
    });
  }

  cancelWorkflowRun(id: string) {
    return this.prisma.workflowRun.update({
      where: { id },
      data: { status: 'CANCELED', finishedAt: new Date() },
    });
  }

  listAiCallLogs(projectId: string) {
    return this.prisma.aiCallLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAuditLogs(projectId: string) {
    return this.prisma.auditLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private createWorkflowRun(
    projectId: string,
    workflowKey: string,
    outputJson?: unknown,
  ) {
    return this.prisma.workflowRun.create({
      data: {
        projectId,
        traceId: `trace_${workflowKey}_${Date.now()}`,
        workflowKey,
        status: 'SUCCEEDED',
        inputJson: {},
        outputJson: outputJson ?? {},
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });
  }

  private createAiCallLog(
    projectId: string,
    skillName: string,
    status: string,
  ) {
    return this.prisma.aiCallLog.create({
      data: {
        projectId,
        traceId: `trace_${skillName}_${Date.now()}`,
        provider: 'openai',
        model: 'gpt-4.1-mini',
        skillName,
        skillVersion: 'v1',
        promptVersion: 'v1',
        inputTokens: 320,
        outputTokens: 680,
        totalTokens: 1000,
        status,
      },
    });
  }

  private asString(value: unknown, fallback: string) {
    return typeof value === 'string' ? value : fallback;
  }

  private requirementJson(language: string) {
    return {
      language,
      summary:
        'Login, testcase generation, coverage review, and Excel export workflow.',
      items: [
        { id: 'REQ_AUTH_001', module: 'Auth', feature: 'Login' },
        { id: 'REQ_QA_001', module: 'QA', feature: 'Generate testcases' },
        { id: 'REQ_EXPORT_001', module: 'Export', feature: 'Excel export' },
      ],
    };
  }

  private requirementMarkdown() {
    return [
      '# Final Requirement',
      '- User can login with valid credentials.',
      '- QA can generate traceable test cases from approved requirements.',
      '- QA can review coverage and export Excel.',
    ].join('\n');
  }

  private qualityJson(score = 84) {
    return {
      score,
      breakdown: [
        { dimension: 'clarity', score },
        { dimension: 'testability', score: score - 4 },
      ],
      recommendations: [
        'Clarify password reset edge cases.',
        'Define export formatting rules.',
      ],
    };
  }

  private requirementItems(requirementVersionId: string) {
    return [
      {
        requirementVersionId,
        externalId: 'REQ_AUTH_001',
        module: 'Auth',
        feature: 'Login',
        type: 'FUNCTIONAL' as const,
        priority: 'HIGH' as const,
        testable: true,
        content: 'User can login with valid email and password.',
      },
      {
        requirementVersionId,
        externalId: 'REQ_QA_001',
        module: 'QA',
        feature: 'Generate testcases',
        type: 'FUNCTIONAL' as const,
        priority: 'HIGH' as const,
        testable: true,
        content:
          'System generates traceable test cases from approved requirements.',
      },
      {
        requirementVersionId,
        externalId: 'REQ_EXPORT_001',
        module: 'Export',
        feature: 'Excel',
        type: 'FUNCTIONAL' as const,
        priority: 'MEDIUM' as const,
        testable: true,
        content: 'QA can export approved testcase set to Excel.',
      },
    ];
  }

  private gapItems(
    projectId: string,
    requirementVersionId: string,
    requirementItemId?: string,
  ) {
    return [
      {
        projectId,
        requirementVersionId,
        requirementItemId,
        externalId: 'GAP_AUTH_001',
        category: 'missing_error_state',
        severity: 'HIGH' as const,
        status: 'OPEN' as const,
        confidence: 0.86,
        evidence: 'Password reset edge cases are not described.',
        description:
          'Missing behavior for expired reset tokens and repeated reset attempts.',
      },
      {
        projectId,
        requirementVersionId,
        requirementItemId: null,
        externalId: 'GAP_EXPORT_001',
        category: 'data_gap',
        severity: 'MEDIUM' as const,
        status: 'RESOLVED' as const,
        confidence: 0.74,
        evidence:
          'Excel template lists required columns but not formatting rules.',
        description: 'Clarify export date format and multiline step rendering.',
      },
    ];
  }

  private testCases(testcaseSetId: string) {
    return [
      {
        testcaseSetId,
        externalId: 'TC_AUTH_LOGIN_001',
        module: 'Auth',
        feature: 'Login',
        title: 'Verify successful login with valid credentials',
        preconditions: 'User account exists.',
        steps: [
          {
            stepNo: 1,
            action: 'Login with valid credentials',
            expected: 'Dashboard is shown',
          },
        ] as Prisma.InputJsonValue,
        expectedResult: 'User is authenticated and redirected to dashboard.',
        priority: 'HIGH' as const,
        type: 'positive',
        status: 'READY' as const,
        requirementRefs: ['REQ_AUTH_001'] as Prisma.InputJsonValue,
      },
      {
        testcaseSetId,
        externalId: 'TC_QA_GENERATE_001',
        module: 'QA',
        feature: 'Generate testcases',
        title: 'Verify testcase generation from approved requirements',
        preconditions: 'Requirement version is approved.',
        steps: [
          {
            stepNo: 1,
            action: 'Generate testcase set',
            expected: 'Traceable test cases are created',
          },
        ] as Prisma.InputJsonValue,
        expectedResult: 'Generated test cases include requirement references.',
        priority: 'HIGH' as const,
        type: 'positive',
        status: 'READY' as const,
        requirementRefs: ['REQ_QA_001'] as Prisma.InputJsonValue,
      },
      {
        testcaseSetId,
        externalId: 'TC_EXPORT_EXCEL_001',
        module: 'Export',
        feature: 'Excel',
        title: 'Verify Excel export for a testcase set',
        preconditions: 'Testcase set exists.',
        steps: [
          {
            stepNo: 1,
            action: 'Export Excel',
            expected: 'XLSX file is generated',
          },
        ] as Prisma.InputJsonValue,
        expectedResult: 'Excel file is downloadable.',
        priority: 'MEDIUM' as const,
        type: 'positive',
        status: 'NEEDS_REVIEW' as const,
        requirementRefs: ['REQ_EXPORT_001'] as Prisma.InputJsonValue,
      },
    ];
  }
}

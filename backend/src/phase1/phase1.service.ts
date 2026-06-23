import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ExcelExporterService } from '../exporter/excel-exporter.service';
import { ParserService } from '../parser/parser.service';
import { PrismaService } from '../prisma/prisma.service';
import { SkillRuntimeService } from '../skill-runtime/skill-runtime.service';
import { StorageService } from '../storage/storage.service';
import {
  AnalyzeRequirementDto,
  ApproveDto,
  CreateArtifactDto,
  GenerateTestcasesDto,
  UpdateGapDto,
  UpdateTestCaseDto,
} from './dto';

const DEFAULT_GATE = { minQualityScore: 70, blockIfOpenGaps: true };

@Injectable()
export class Phase1Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly skillRuntime: SkillRuntimeService,
    private readonly parser: ParserService,
    private readonly exporter: ExcelExporterService,
    private readonly storage: StorageService,
  ) {}

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

  async uploadArtifact(
    projectId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const allowedMimes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/webp',
    ]);
    if (!allowedMimes.has(file.mimetype) && !['pdf','docx','txt','xlsx','csv','png','jpg','jpeg','webp'].includes(ext)) {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    const type = file.mimetype.startsWith('image/') ? 'IMAGE'
      : ['xlsx','csv'].includes(ext) ? 'SPREADSHEET'
      : 'DOCUMENT';

    const artifact = await this.prisma.artifact.create({
      data: {
        projectId,
        type,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: `artifacts/${projectId}/${Date.now()}-${file.originalname}`,
        status: 'UPLOADED',
      },
    });

    await this.storage.save(artifact.storageKey!, file.buffer);
    return artifact;
  }

  async parseArtifact(id: string) {
    const artifact = await this.prisma.artifact.findUnique({ where: { id } });
    if (!artifact) throw new NotFoundException(`Artifact ${id} was not found`);

    // Mark as PARSING immediately
    await this.prisma.artifact.update({
      where: { id },
      data: { status: 'PARSING' },
    });

    try {
      let parsedContent: Record<string, unknown>;

      if (artifact.sourceText) {
        // TEXT or FIGMA artifact — use sourceText directly
        parsedContent = {
          text: artifact.sourceText,
          parser: artifact.type === 'FIGMA' ? 'figma_url' : 'text_plain',
        };
      } else if (artifact.storageKey) {
        // Binary file stored on disk — read and parse
        const fileBuffer = await this.storage.read(artifact.storageKey);
        if (!fileBuffer) {
          throw new NotFoundException(
            `File not found in storage: ${artifact.storageKey}`,
          );
        }
        const result = await this.parser.parseBuffer(
          fileBuffer,
          artifact.mimeType ?? '',
          artifact.fileName ?? undefined,
        );
        parsedContent = {
          text: result.text,
          parser: result.parser,
          ...(result.pageCount != null ? { pageCount: result.pageCount } : {}),
          ...(result.sheetNames ? { sheetNames: result.sheetNames } : {}),
          ...(result.warnings?.length ? { warnings: result.warnings } : {}),
        };
      } else {
        parsedContent = {
          text: 'No content available.',
          parser: 'empty',
          warnings: ['Artifact has no sourceText and no storageKey'],
        };
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.artifact.update({
          where: { id },
          data: { status: 'PARSED', parsedContent: parsedContent as Prisma.InputJsonValue },
        });
        return this.createWorkflowRun(tx, artifact.projectId, 'artifact_parse', {
          artifactId: id,
          parser: parsedContent.parser,
          textLength: typeof parsedContent.text === 'string' ? parsedContent.text.length : 0,
        });
      });
    } catch (err) {
      await this.prisma.artifact.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorReason: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  }

  async analyzeRequirement(projectId: string, dto: AnalyzeRequirementDto) {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id: dto.artifactId },
    });
    if (!artifact) {
      throw new NotFoundException(`Artifact ${dto.artifactId} was not found`);
    }
    if (artifact.projectId !== projectId) {
      throw new ForbiddenException(
        `Artifact ${dto.artifactId} does not belong to project ${projectId}`,
      );
    }

    const language = dto.language ?? 'vi';
    const skillResult = await this.skillRuntime.run({
      skillName: 'requirement_reader',
      projectId,
      defaultPrompt: `You are a QA analyst. Parse the requirement text into structured items. Language: {{language}}. Source:\n{{sourceText}}`,
      variables: {
        language,
        sourceText:
          artifact.sourceText ?? artifact.parsedContent ?? 'No content',
      },
      fallback: () => ({
        contentJson: this.requirementJson(language),
        contentMarkdown: this.requirementMarkdown(),
        items: this.requirementItems(''),
      }),
    });

    const aiOutput = skillResult.output as {
      contentJson?: unknown;
      contentMarkdown?: string;
      items?: unknown[];
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const versionNo =
          (await tx.requirementVersion.count({ where: { projectId } })) + 1;
        const requirementVersion = await tx.requirementVersion.create({
          data: {
            projectId,
            sourceArtifactId: artifact.id,
            versionNo,
            status: 'ANALYZED',
            qualityScore: 84,
            qualityJson: this.qualityJson(),
            contentJson: (aiOutput.contentJson ??
              this.requirementJson(language)) as Prisma.InputJsonValue,
            contentMarkdown:
              aiOutput.contentMarkdown ?? this.requirementMarkdown(),
          },
        });

        const items = this.normalizeRequirementItems(
          aiOutput.items,
          requirementVersion.id,
        );
        await tx.requirementItem.createMany({ data: items });

        return this.createWorkflowRun(tx, projectId, 'requirement_analysis', {
          requirementVersionId: requirementVersion.id,
          aiSource: skillResult.source,
          provider: skillResult.provider,
          model: skillResult.model,
          promptVersion: skillResult.promptVersion,
        });
      });
    } catch (error) {
      this.throwConflictOnUniqueRace(error, 'Requirement version');
      throw error;
    }
  }

  listRequirementVersions(projectId: string) {
    return this.prisma.requirementVersion.findMany({
      where: { projectId },
      orderBy: { versionNo: 'desc' },
      include: { _count: { select: { items: true, gaps: true } } },
    });
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
    await this.prisma.$transaction(async (tx) => {
      await tx.requirementItem.deleteMany({
        where: { requirementVersionId: id },
      });
      await tx.requirementItem.createMany({
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
    });
    return this.getRequirementVersion(id);
  }
  async queueQuality(id: string) {
    const version = await this.getRequirementVersion(id);

    const skillResult = await this.skillRuntime.run({
      skillName: 'requirement_quality_checker',
      projectId: version.projectId,
      defaultPrompt: `Score the requirement quality across 8 dimensions (0-100). Return JSON {score, breakdown, recommendations}. Requirement:\n{{content}}`,
      variables: { content: JSON.stringify(version.contentJson) },
      fallback: () => this.qualityJson(),
    });

    const quality = skillResult.output as {
      score?: number;
      breakdown?: unknown;
      recommendations?: unknown;
    };

    return this.prisma.$transaction(async (tx) => {
      await tx.requirementVersion.update({
        where: { id },
        data: {
          qualityScore: typeof quality.score === 'number' ? quality.score : 84,
          qualityJson: quality as Prisma.InputJsonValue,
        },
      });
      return this.createWorkflowRun(
        tx,
        version.projectId,
        'requirement_quality',
        {
          requirementVersionId: id,
          aiSource: skillResult.source,
          promptVersion: skillResult.promptVersion,
        },
      );
    });
  }

  async detectGaps(id: string) {
    const version = await this.getRequirementVersion(id);
    const items = await this.prisma.requirementItem.findMany({
      where: { requirementVersionId: id },
      orderBy: { createdAt: 'asc' },
    });

    const skillResult = await this.skillRuntime.run({
      skillName: 'gap_detector',
      projectId: version.projectId,
      defaultPrompt: `Identify gaps in the requirement. Return JSON {gaps: [{externalId, category, severity, confidence, evidence, description}]}. Requirement:\n{{content}}`,
      variables: { content: JSON.stringify(version.contentJson) },
      fallback: () => ({
        gaps: this.gapItems(version.projectId, id, items[0]?.id),
      }),
    });

    const aiGaps = (skillResult.output as { gaps?: unknown[] }).gaps ?? [];
    const gapsToWrite = this.normalizeGapItems(
      aiGaps,
      version.projectId,
      id,
      items[0]?.id,
    );

    return this.prisma.$transaction(async (tx) => {
      for (const gap of gapsToWrite) {
        await tx.gapItem.upsert({
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

      return this.createWorkflowRun(tx, version.projectId, 'gap_detection', {
        requirementVersionId: id,
        aiSource: skillResult.source,
        promptVersion: skillResult.promptVersion,
      });
    });
  }

  listGaps(id: string) {
    return this.prisma.gapItem.findMany({
      where: { requirementVersionId: id },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateGap(id: string, dto: UpdateGapDto) {
    try {
      return await this.prisma.gapItem.update({
        where: { id },
        data: {
          status: dto.status,
          resolutionNote: dto.resolutionNote,
        },
      });
    } catch (error) {
      this.throwNotFoundOnMissingRecord(error, `Gap ${id} was not found`);
      throw error;
    }
  }

  async rewriteRequirement(id: string) {
    const version = await this.getRequirementVersion(id);
    const items = await this.prisma.requirementItem.findMany({
      where: { requirementVersionId: id },
    });
    const gaps = await this.prisma.gapItem.findMany({
      where: { requirementVersionId: id },
    });

    const skillResult = await this.skillRuntime.run({
      skillName: 'requirement_rewriter',
      projectId: version.projectId,
      defaultPrompt: `Rewrite the requirement, addressing all resolved gaps. Return JSON {contentJson, contentMarkdown}. Original:\n{{content}}\nGaps:\n{{gaps}}`,
      variables: {
        content: JSON.stringify(version.contentJson),
        gaps: JSON.stringify(gaps),
      },
      fallback: () => ({
        contentJson: version.contentJson,
        contentMarkdown: `${version.contentMarkdown ?? this.requirementMarkdown()}\n\nRisk note: unresolved gaps require QA approval override.`,
      }),
    });

    const rewriteOut = skillResult.output as {
      contentJson?: unknown;
      contentMarkdown?: string;
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const nextVersionNo =
          (await tx.requirementVersion.count({
            where: { projectId: version.projectId },
          })) + 1;
        const rewritten = await tx.requirementVersion.create({
          data: {
            projectId: version.projectId,
            sourceArtifactId: version.sourceArtifactId,
            versionNo: nextVersionNo,
            status: 'REWRITTEN',
            qualityScore: 90,
            qualityJson: this.qualityJson(90),
            contentJson: (rewriteOut.contentJson ??
              version.contentJson) as Prisma.InputJsonValue,
            contentMarkdown:
              rewriteOut.contentMarkdown ??
              `${version.contentMarkdown ?? this.requirementMarkdown()}\n\nRewritten v${nextVersionNo}.`,
          },
        });
        await tx.requirementItem.createMany({
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
        return this.createWorkflowRun(
          tx,
          version.projectId,
          'requirement_rewrite',
          {
            requirementVersionId: rewritten.id,
            aiSource: skillResult.source,
            promptVersion: skillResult.promptVersion,
          },
        );
      });
    } catch (error) {
      this.throwConflictOnUniqueRace(error, 'Requirement version');
      throw error;
    }
  }

  async approveRequirement(id: string, dto: ApproveDto) {
    const version = await this.getRequirementVersion(id);

    const gate = await this.resolveGateConfig(version.projectId);
    const qualityScore = version.qualityScore ?? 0;
    const qualityPassed = qualityScore >= gate.minQualityScore;
    const openGaps = await this.prisma.gapItem.count({
      where: { requirementVersionId: id, status: 'OPEN' },
    });
    const gapsPassed = !gate.blockIfOpenGaps || openGaps === 0;

    if ((!qualityPassed || !gapsPassed) && !dto.override) {
      const reasons: string[] = [];
      if (!qualityPassed)
        reasons.push(
          `Quality score ${qualityScore} < minimum ${gate.minQualityScore}`,
        );
      if (!gapsPassed) reasons.push(`${openGaps} unresolved gap(s) remain`);
      throw new UnprocessableEntityException(
        `Approval gate failed: ${reasons.join('; ')}. Use override=true to continue.`,
      );
    }

    const passed = qualityPassed && gapsPassed;
    const label = passed ? 'Approved' : 'Draft with unresolved risk';

    const approved = await this.prisma.requirementVersion.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        lockedAt: new Date(),
      },
    });

    await this.audit.log({
      projectId: version.projectId,
      action: 'requirement.approved',
      entityType: 'RequirementVersion',
      entityId: id,
      metadata: { gate: { passed, override: Boolean(dto.override), label } },
    });

    return {
      ...approved,
      gate: { passed, override: Boolean(dto.override), label },
    };
  }

  async generateTestcases(id: string, dto: GenerateTestcasesDto) {
    const version = await this.getRequirementVersion(id);

    if (version.status !== 'APPROVED') {
      throw new UnprocessableEntityException(
        `Requirement version must be APPROVED before generating testcases. Current status: ${version.status}`,
      );
    }

    const skillResult = await this.skillRuntime.run({
      skillName: 'testcase_generator',
      projectId: version.projectId,
      defaultPrompt: `Generate test cases for the approved requirement. Config: {{config}}. Return JSON {testCases:[{externalId, module, feature, title, preconditions, steps, expectedResult, priority, type, status, requirementRefs}]}. Requirement:\n{{content}}`,
      variables: {
        content: JSON.stringify(version.contentJson),
        config: JSON.stringify(dto),
      },
      fallback: () => ({ testCases: this.testCases('') }),
    });

    const aiCases =
      (skillResult.output as { testCases?: unknown[] }).testCases ?? [];

    try {
      return await this.prisma.$transaction(async (tx) => {
        const setVersionNo =
          (await tx.testcaseSet.count({
            where: { projectId: version.projectId, requirementVersionId: id },
          })) + 1;
        const testcaseSet = await tx.testcaseSet.create({
          data: {
            projectId: version.projectId,
            requirementVersionId: id,
            versionNo: setVersionNo,
            status: 'GENERATED',
            generationConfig: dto as Prisma.InputJsonValue,
            ...(skillResult.promptVersion
              ? {}
              : {}),
          },
        });
        await tx.testCase.createMany({
          data: this.normalizeTestCases(aiCases, testcaseSet.id),
        });
        const run = await this.createWorkflowRun(
          tx,
          version.projectId,
          'testcase_generation',
          {
            testcaseSetId: testcaseSet.id,
            aiSource: skillResult.source,
            promptVersion: skillResult.promptVersion,
          },
        );
        await this.audit.log({
          projectId: version.projectId,
          action: 'testcase_set.generated',
          entityType: 'TestcaseSet',
          entityId: testcaseSet.id,
          metadata: {
            requirementVersionId: id,
            versionNo: testcaseSet.versionNo,
          },
        });
        return run;
      });
    } catch (error) {
      this.throwConflictOnUniqueRace(error, 'Testcase set');
      throw error;
    }
  }

  async getTestcaseSet(id: string) {
    const set = await this.prisma.testcaseSet.findUnique({
      where: { id },
      include: { testCases: true, coverageItems: true, exports: true },
    });
    if (!set) throw new NotFoundException(`Testcase set ${id} was not found`);
    return set;
  }

  async updateTestCase(id: string, dto: UpdateTestCaseDto) {
    try {
      return await this.prisma.testCase.update({
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
    } catch (error) {
      this.throwNotFoundOnMissingRecord(error, `Test case ${id} was not found`);
      throw error;
    }
  }

  async checkCoverage(id: string) {
    const set = await this.getTestcaseSet(id);
    const items = await this.prisma.requirementItem.findMany({
      where: { requirementVersionId: set.requirementVersionId },
      orderBy: { createdAt: 'asc' },
    });

    const skillResult = await this.skillRuntime.run({
      skillName: 'coverage_checker',
      projectId: set.projectId,
      defaultPrompt: `Map requirements to test cases. Return JSON {coverage:[{requirementExternalId, status (COVERED|PARTIAL|MISSING|NOT_TESTABLE), coveragePercent, testcaseRefs}]}. Requirements:\n{{items}}\nTest cases:\n{{cases}}`,
      variables: {
        items: JSON.stringify(items.map((i) => i.externalId)),
        cases: JSON.stringify(set.testCases.map((c) => c.externalId)),
      },
      fallback: () => ({
        coverage: items.map((item, index) => ({
          requirementExternalId: item.externalId,
          status: index < 2 ? 'COVERED' : 'PARTIAL',
          coveragePercent: index < 2 ? 100 : 50,
          testcaseRefs: ['TC_AUTH_LOGIN_001'],
        })),
      }),
    });

    const aiCoverage =
      (skillResult.output as { coverage?: unknown[] }).coverage ?? [];

    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const match = (aiCoverage as Array<Record<string, unknown>>).find(
          (c) => c.requirementExternalId === item.externalId,
        );
        const status = this.toCoverageStatus(match?.status as string | undefined);
        const coveragePercent =
          typeof match?.coveragePercent === 'number'
            ? match.coveragePercent
            : status === 'COVERED'
              ? 100
              : 50;
        const refs = Array.isArray(match?.testcaseRefs)
          ? (match.testcaseRefs as string[])
          : ['TC_AUTH_LOGIN_001'];

        await tx.coverageItem.upsert({
          where: {
            requirementItemId_testcaseSetId: {
              requirementItemId: item.id,
              testcaseSetId: id,
            },
          },
          update: {
            status,
            coveragePercent,
            testcaseRefs: refs as Prisma.InputJsonValue,
          },
          create: {
            requirementVersionId: set.requirementVersionId,
            requirementItemId: item.id,
            testcaseSetId: id,
            status,
            coveragePercent,
            testcaseRefs: refs as Prisma.InputJsonValue,
          },
        });
      }

      return this.createWorkflowRun(tx, set.projectId, 'coverage_check', {
        testcaseSetId: id,
        aiSource: skillResult.source,
        promptVersion: skillResult.promptVersion,
      });
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

    // Create export record in RUNNING state
    const exportArtifact = await this.prisma.exportArtifact.create({
      data: {
        projectId: set.projectId,
        testcaseSetId: id,
        format: 'xlsx',
        status: 'RUNNING',
        fileName: `testcases-v${set.versionNo}.xlsx`,
        storageKey: `exports/${set.id}/testcases-v${set.versionNo}.xlsx`,
      },
    });

    try {
      const project = await this.prisma.project.findUnique({
        where: { id: set.projectId },
        select: { name: true },
      });

      const result = await this.exporter.exportTestcases(
        set.testCases,
        set.versionNo,
        project?.name,
      );

      await this.storage.save(exportArtifact.storageKey!, result.buffer);

      await this.prisma.exportArtifact.update({
        where: { id: exportArtifact.id },
        data: {
          status: 'SUCCEEDED',
          fileName: result.fileName,
          sizeBytes: result.sizeBytes,
        },
      });

      await this.audit.log({
        projectId: set.projectId,
        action: 'export.created',
        entityType: 'ExportArtifact',
        entityId: exportArtifact.id,
        metadata: { testcaseSetId: id, format: 'xlsx', sizeBytes: result.sizeBytes },
      });

      return this.prisma.$transaction(async (tx) => {
        return this.createWorkflowRun(tx, set.projectId, 'excel_export', {
          exportArtifactId: exportArtifact.id,
          fileName: result.fileName,
          sizeBytes: result.sizeBytes,
        });
      });
    } catch (err) {
      await this.prisma.exportArtifact.update({
        where: { id: exportArtifact.id },
        data: {
          status: 'FAILED',
          errorReason: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
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
    if (exportArtifact.status !== 'SUCCEEDED' || !exportArtifact.storageKey) {
      throw new NotFoundException(`Export ${id} is not ready for download`);
    }
    const buffer = await this.storage.read(exportArtifact.storageKey);
    if (!buffer) {
      throw new NotFoundException(`Export file not found in storage`);
    }
    return { buffer, fileName: exportArtifact.fileName ?? `export-${id}.xlsx` };
  }

  async getWorkflowRun(id: string) {
    const workflowRun = await this.prisma.workflowRun.findUnique({
      where: { id },
    });
    if (!workflowRun)
      throw new NotFoundException(`Workflow run ${id} was not found`);
    return workflowRun;
  }

  async retryWorkflowRun(id: string) {
    try {
      return await this.prisma.workflowRun.update({
        where: { id },
        data: { status: 'QUEUED', errorReason: null, finishedAt: null },
      });
    } catch (error) {
      this.throwNotFoundOnMissingRecord(
        error,
        `Workflow run ${id} was not found`,
      );
      throw error;
    }
  }

  async cancelWorkflowRun(id: string) {
    try {
      return await this.prisma.workflowRun.update({
        where: { id },
        data: { status: 'CANCELED', finishedAt: new Date() },
      });
    } catch (error) {
      this.throwNotFoundOnMissingRecord(
        error,
        `Workflow run ${id} was not found`,
      );
      throw error;
    }
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

  private async resolveGateConfig(projectId: string) {
    const config = await this.prisma.configVersion.findFirst({
      where: { projectId, name: 'quality_gate', status: 'ACTIVE' },
    });
    if (!config) return DEFAULT_GATE;
    const content = config.contentJson as Record<string, unknown>;
    return {
      minQualityScore:
        typeof content.minQualityScore === 'number'
          ? content.minQualityScore
          : DEFAULT_GATE.minQualityScore,
      blockIfOpenGaps:
        typeof content.blockIfOpenGaps === 'boolean'
          ? content.blockIfOpenGaps
          : DEFAULT_GATE.blockIfOpenGaps,
    };
  }

  private createWorkflowRun(
    client: PrismaService | Prisma.TransactionClient,
    projectId: string,
    workflowKey: string,
    outputJson?: unknown,
  ) {
    return client.workflowRun.create({
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

  private normalizeRequirementItems(
    raw: unknown[] | undefined,
    requirementVersionId: string,
  ) {
    if (!raw || raw.length === 0) {
      return this.requirementItems(requirementVersionId);
    }
    return raw.map((item, index) => {
      const v = item as Record<string, unknown>;
      return {
        requirementVersionId,
        externalId: this.asString(
          v.externalId ?? v.id,
          `REQ_AI_${String(index + 1).padStart(3, '0')}`,
        ),
        module: this.asString(v.module, 'General'),
        feature: this.asString(v.feature, 'Requirement'),
        type: 'FUNCTIONAL' as const,
        priority: this.toPriority(v.priority),
        testable: Boolean(v.testable ?? true),
        content: this.asString(v.content ?? v.description, ''),
        metadata: (v.metadata ?? {}) as Prisma.InputJsonValue,
      };
    });
  }

  private normalizeGapItems(
    raw: unknown[],
    projectId: string,
    requirementVersionId: string,
    requirementItemId: string | undefined,
  ) {
    if (raw.length === 0) {
      return this.gapItems(projectId, requirementVersionId, requirementItemId);
    }
    return raw.map((g, index) => {
      const v = g as Record<string, unknown>;
      return {
        projectId,
        requirementVersionId,
        requirementItemId: requirementItemId ?? null,
        externalId: this.asString(
          v.externalId ?? v.id,
          `GAP_AI_${String(index + 1).padStart(3, '0')}`,
        ),
        category: this.asString(v.category, 'general'),
        severity: this.toSeverity(v.severity),
        status: 'OPEN' as const,
        confidence: typeof v.confidence === 'number' ? v.confidence : 0.7,
        evidence: this.asString(v.evidence, 'AI-detected'),
        description: this.asString(v.description, this.asString(v.evidence, '')),
      };
    });
  }

  private normalizeTestCases(raw: unknown[], testcaseSetId: string) {
    if (raw.length === 0) return this.testCases(testcaseSetId);
    return raw.map((c, index) => {
      const v = c as Record<string, unknown>;
      return {
        testcaseSetId,
        externalId: this.asString(
          v.externalId ?? v.id,
          `TC_AI_${String(index + 1).padStart(3, '0')}`,
        ),
        module: this.asString(v.module, 'General'),
        feature: this.asString(v.feature, 'Generated'),
        title: this.asString(v.title, `Test case ${index + 1}`),
        preconditions: this.asString(v.preconditions, ''),
        steps: (Array.isArray(v.steps)
          ? v.steps
          : [
              {
                stepNo: 1,
                action: this.asString(v.action, 'Execute'),
                expected: this.asString(v.expectedResult ?? v.expected, ''),
              },
            ]) as Prisma.InputJsonValue,
        expectedResult: this.asString(v.expectedResult, ''),
        priority: this.toPriority(v.priority),
        type: this.asString(v.type, 'positive'),
        status: 'READY' as const,
        requirementRefs: (Array.isArray(v.requirementRefs)
          ? v.requirementRefs
          : []) as Prisma.InputJsonValue,
      };
    });
  }

  private toPriority(v: unknown): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const s = typeof v === 'string' ? v.toUpperCase() : '';
    if (s === 'CRITICAL' || s === 'HIGH' || s === 'MEDIUM' || s === 'LOW')
      return s;
    return 'MEDIUM';
  }

  private toSeverity(v: unknown): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const s = typeof v === 'string' ? v.toUpperCase() : '';
    if (s === 'CRITICAL' || s === 'HIGH' || s === 'MEDIUM' || s === 'LOW')
      return s;
    return 'MEDIUM';
  }

  private toCoverageStatus(
    v: string | undefined,
  ): 'COVERED' | 'PARTIAL' | 'MISSING' | 'NOT_TESTABLE' {
    const s = (v ?? '').toUpperCase();
    if (
      s === 'COVERED' ||
      s === 'PARTIAL' ||
      s === 'MISSING' ||
      s === 'NOT_TESTABLE'
    )
      return s;
    return 'PARTIAL';
  }

  private asString(value: unknown, fallback: string) {
    return typeof value === 'string' ? value : fallback;
  }

  private throwNotFoundOnMissingRecord(error: unknown, message: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(message);
    }
  }

  private throwConflictOnUniqueRace(error: unknown, label: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        `${label} version conflict. Please retry the workflow.`,
      );
    }
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

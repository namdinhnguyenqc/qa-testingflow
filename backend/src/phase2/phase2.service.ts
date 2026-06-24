import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CostSummaryQueryDto,
  CreatePromptVersionDto,
  ReadFigmaDto,
  TestSkillDto,
  UpdateBudgetConfigDto,
  UpdateGateConfigDto,
} from './dto';

interface FigmaFileResponse {
  name?: string;
  lastModified?: string;
  thumbnailUrl?: string;
  document?: unknown;
  err?: string;
}

@Injectable()
export class Phase2Service {
  private readonly logger = new Logger(Phase2Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly aiGateway: AiGatewayService,
    private readonly configService: ConfigService,
  ) {}

  // ─── A2.2 Prompt versioning ──────────────────────────────────────────────

  async createPromptVersion(dto: CreatePromptVersionDto) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const latest = await this.prisma.promptVersion.findFirst({
        where: { name: dto.name },
        orderBy: { versionNo: 'desc' },
      });
      const versionNo = (latest?.versionNo ?? 0) + 1;

      try {
        return await this.prisma.promptVersion.create({
          data: {
            name: dto.name,
            versionNo,
            content: dto.content,
            variables: dto.variables as Prisma.InputJsonValue,
            notes: dto.notes,
            isActive: false,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt === 0
        ) {
          continue;
        }
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            `Prompt version conflict for "${dto.name}" v${versionNo}. Please retry.`,
          );
        }
        throw error;
      }
    }

    throw new ConflictException(`Prompt version conflict for "${dto.name}".`);
  }

  listPromptVersions(name?: string) {
    return this.prisma.promptVersion.findMany({
      where: name ? { name } : undefined,
      orderBy: [{ name: 'asc' }, { versionNo: 'desc' }],
    });
  }

  async getPromptVersion(id: string) {
    const prompt = await this.prisma.promptVersion.findUnique({
      where: { id },
    });
    if (!prompt) throw new NotFoundException(`Prompt version ${id} not found`);
    return prompt;
  }

  async activatePromptVersion(id: string) {
    const prompt = await this.getPromptVersion(id);

    const activated = await this.prisma.$transaction(async (tx) => {
      await tx.promptVersion.updateMany({
        where: { name: prompt.name, isActive: true },
        data: { isActive: false },
      });

      return tx.promptVersion.update({
        where: { id },
        data: { isActive: true },
      });
    });

    await this.audit.log({
      action: 'prompt_version.activated',
      entityType: 'PromptVersion',
      entityId: id,
      metadata: { name: prompt.name, versionNo: prompt.versionNo },
    });

    return activated;
  }

  // ─── A2.4 Quality gate config ────────────────────────────────────────────

  async upsertGateConfig(projectId: string, dto: UpdateGateConfigDto) {
    const existing = await this.prisma.configVersion.findFirst({
      where: { projectId, name: 'quality_gate', status: 'ACTIVE' },
    });

    const content = {
      minQualityScore: dto.minQualityScore ?? 70,
      blockIfOpenGaps: dto.blockIfOpenGaps ?? true,
    };

    if (existing) {
      const updated = await this.prisma.configVersion.update({
        where: { id: existing.id },
        data: { contentJson: content },
      });
      await this.audit.log({
        projectId,
        action: 'gate_config.updated',
        entityType: 'ConfigVersion',
        entityId: existing.id,
        after: content,
      });
      return updated;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.configVersion.updateMany({
        where: { projectId, name: 'quality_gate', status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });
      const versionNo =
        (await tx.configVersion.count({
          where: { projectId, name: 'quality_gate' },
        })) + 1;
      return tx.configVersion.create({
        data: {
          projectId,
          name: 'quality_gate',
          versionNo,
          status: 'ACTIVE',
          contentJson: content,
        },
      });
    });
    await this.audit.log({
      projectId,
      action: 'gate_config.created',
      entityType: 'ConfigVersion',
      entityId: created.id,
      after: content,
    });
    return created;
  }

  getGateConfig(projectId: string) {
    return this.prisma.configVersion.findFirst({
      where: { projectId, name: 'quality_gate', status: 'ACTIVE' },
    });
  }

  // ─── A2.5 Audit log query ────────────────────────────────────────────────

  listAuditLogs(projectId?: string, action?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // ─── A2.6 Cost tracking ──────────────────────────────────────────────────

  async getCostSummary(projectId: string | null, dto: CostSummaryQueryDto) {
    const since = this.periodStart(dto.period ?? 'month');

    const logs = await this.prisma.aiCallLog.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        createdAt: { gte: since },
      },
      select: {
        provider: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costUsd: true,
        status: true,
      },
    });

    // group by provider+model
    const groups = new Map<
      string,
      {
        provider: string;
        model: string;
        calls: number;
        totalTokens: number;
        costUsd: number;
        errors: number;
      }
    >();

    for (const log of logs) {
      const key = `${log.provider}::${log.model}`;
      const existing = groups.get(key) ?? {
        provider: log.provider,
        model: log.model,
        calls: 0,
        totalTokens: 0,
        costUsd: 0,
        errors: 0,
      };
      existing.calls += 1;
      existing.totalTokens += log.totalTokens ?? 0;
      existing.costUsd += log.costUsd ?? 0;
      if (log.status !== 'SUCCEEDED') existing.errors += 1;
      groups.set(key, existing);
    }

    const breakdown = Array.from(groups.values());
    const totalCostUsd = breakdown.reduce((sum, g) => sum + g.costUsd, 0);

    return {
      projectId: projectId ?? 'global',
      period: dto.period ?? 'month',
      since: since.toISOString(),
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      totalCalls: logs.length,
      breakdown,
    };
  }

  async getBudgetStatus(projectId: string) {
    const gateConfig = await this.prisma.configVersion.findFirst({
      where: { projectId, name: 'budget', status: 'ACTIVE' },
    });
    const budgetUsd =
      (gateConfig?.contentJson as Record<string, number> | null)
        ?.hardLimitUsd ?? 50;
    const warnAt =
      (gateConfig?.contentJson as Record<string, number> | null)
        ?.warnAtPercent ?? 80;

    const since = this.periodStart('month');
    const logs = await this.prisma.aiCallLog.findMany({
      where: { projectId, createdAt: { gte: since } },
      select: { costUsd: true },
    });
    const spentUsd = logs.reduce((s, l) => s + (l.costUsd ?? 0), 0);
    const pct = budgetUsd > 0 ? (spentUsd / budgetUsd) * 100 : 0;

    return {
      projectId,
      budgetUsd,
      spentUsd: Math.round(spentUsd * 1_000_000) / 1_000_000,
      usagePercent: Math.round(pct * 10) / 10,
      warning: pct >= warnAt,
      exceeded: spentUsd > budgetUsd,
    };
  }

  // ─── A2.7 Figma reader skill ─────────────────────────────────────────────

  async upsertBudgetConfig(projectId: string, dto: UpdateBudgetConfigDto) {
    const content = {
      hardLimitUsd: dto.hardLimitUsd ?? 50,
      warnAtPercent: dto.warnAtPercent ?? 80,
    };
    const existing = await this.prisma.configVersion.findFirst({
      where: { projectId, name: 'budget', status: 'ACTIVE' },
    });

    if (existing) {
      const updated = await this.prisma.configVersion.update({
        where: { id: existing.id },
        data: { contentJson: content },
      });
      await this.audit.log({
        projectId,
        action: 'budget_config.updated',
        entityType: 'ConfigVersion',
        entityId: existing.id,
        after: content,
      });
      return updated;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.configVersion.updateMany({
        where: { projectId, name: 'budget', status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });
      const versionNo =
        (await tx.configVersion.count({
          where: { projectId, name: 'budget' },
        })) + 1;
      return tx.configVersion.create({
        data: {
          projectId,
          name: 'budget',
          versionNo,
          status: 'ACTIVE',
          contentJson: content,
        },
      });
    });
    await this.audit.log({
      projectId,
      action: 'budget_config.created',
      entityType: 'ConfigVersion',
      entityId: created.id,
      after: content,
    });
    return created;
  }

  async readFigma(dto: ReadFigmaDto) {
    if (
      dto.accessToken &&
      this.configService.get<string>('NODE_ENV') === 'production'
    ) {
      throw new ForbiddenException(
        'Inline Figma access tokens are disabled in production',
      );
    }
    const token =
      dto.accessToken ?? this.configService.get<string>('FIGMA_ACCESS_TOKEN');

    if (!token) {
      return {
        success: false,
        warning: 'FIGMA_ACCESS_TOKEN not configured. Figma input skipped.',
        data: null,
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const url = dto.nodeIds
        ? `https://api.figma.com/v1/files/${dto.fileKey}/nodes?ids=${encodeURIComponent(dto.nodeIds)}`
        : `https://api.figma.com/v1/files/${dto.fileKey}`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'X-Figma-Token': token },
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const body = (await response
          .json()
          .catch(() => ({}))) as FigmaFileResponse;
        const reason = body.err ?? `HTTP ${response.status}`;
        this.logger.warn(`Figma API error for file ${dto.fileKey}: ${reason}`);
        return {
          success: false,
          warning: `Figma API returned error: ${reason}. Workflow continues.`,
          data: null,
        };
      }

      const data = (await response.json()) as FigmaFileResponse;
      return {
        success: true,
        warning: null,
        data: {
          fileKey: dto.fileKey,
          name: data.name,
          lastModified: data.lastModified,
          thumbnailUrl: data.thumbnailUrl,
        },
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Figma read failed (non-blocking): ${reason}`);
      return {
        success: false,
        warning: `Figma read failed: ${reason}. Workflow continues.`,
        data: null,
      };
    }
  }

  // ─── A2.1/A2.3 Test skill call (exposes callSkillWithFallback to API) ────

  async callSkillTest(dto: TestSkillDto) {
    const enabled =
      this.configService.get<string>('ENABLE_SKILL_TEST_CALL') === 'true' ||
      this.configService.get<string>('NODE_ENV') !== 'production';
    if (!enabled) {
      throw new ForbiddenException('Skill test calls are disabled');
    }

    try {
      const result = await this.aiGateway.callSkillWithFallback({
        primaryProvider: dto.provider,
        primaryModel: dto.model,
        fallbackProvider: dto.fallbackProvider,
        fallbackModel: dto.fallbackModel,
        prompt: dto.prompt,
        projectId: dto.projectId,
        skillName: dto.skillName ?? 'manual_skill_test',
        promptVersion: dto.promptVersion,
      });
      await this.audit.log({
        projectId: dto.projectId,
        action: 'skill.test_call',
        entityType: 'Skill',
        metadata: {
          provider: result.provider,
          model: result.model,
          usedFallback: result.usedFallback,
        },
      });
      return result;
    } catch (error) {
      await this.audit.log({
        projectId: dto.projectId,
        action: 'skill.test_call_failed',
        entityType: 'Skill',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  // ─── A3.3 Workflow builder config ───────────────────────────────────────

  private readonly REQUIRED_STEPS = [
    'artifact_parse',
    'requirement_analyze',
    'testcase_generate',
  ];

  async createWorkflowVersion(dto: {
    name: string;
    description?: string;
    definition: Record<string, unknown>;
  }) {
    this.validateWorkflowDefinition(dto.definition);

    for (let attempt = 0; attempt < 2; attempt++) {
      const latest = await this.prisma.workflowVersion.findFirst({
        where: { name: dto.name },
        orderBy: { versionNo: 'desc' },
      });
      const versionNo = (latest?.versionNo ?? 0) + 1;
      try {
        const created = await this.prisma.workflowVersion.create({
          data: {
            name: dto.name,
            versionNo,
            description: dto.description,
            definition: dto.definition as Prisma.InputJsonValue,
            isActive: false,
          },
        });
        await this.audit.log({
          action: 'workflow_version.created',
          entityType: 'WorkflowVersion',
          entityId: created.id,
          metadata: { name: dto.name, versionNo },
        });
        return created;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt === 0
        ) continue;
        throw error;
      }
    }
    throw new ConflictException(`Workflow version conflict for "${dto.name}".`);
  }

  listWorkflowVersions(name?: string) {
    return this.prisma.workflowVersion.findMany({
      where: name ? { name } : undefined,
      orderBy: [{ name: 'asc' }, { versionNo: 'desc' }],
    });
  }

  async getWorkflowVersion(id: string) {
    const wv = await this.prisma.workflowVersion.findUnique({ where: { id } });
    if (!wv) throw new NotFoundException(`WorkflowVersion ${id} not found`);
    return wv;
  }

  async activateWorkflowVersion(id: string) {
    const wv = await this.getWorkflowVersion(id);
    this.validateWorkflowDefinition(wv.definition as Record<string, unknown>);

    const activated = await this.prisma.$transaction(async (tx) => {
      await tx.workflowVersion.updateMany({
        where: { name: wv.name, isActive: true },
        data: { isActive: false },
      });
      return tx.workflowVersion.update({ where: { id }, data: { isActive: true } });
    });

    await this.audit.log({
      action: 'workflow_version.activated',
      entityType: 'WorkflowVersion',
      entityId: id,
      metadata: { name: wv.name, versionNo: wv.versionNo },
    });
    return activated;
  }

  private validateWorkflowDefinition(definition: Record<string, unknown>) {
    const steps = (definition.steps as string[] | undefined) ?? [];
    const missing = this.REQUIRED_STEPS.filter((s) => !steps.includes(s));
    if (missing.length) {
      throw new ConflictException(
        `Workflow definition missing required steps: ${missing.join(', ')}`,
      );
    }
  }

  // ─── A3.4 Prompt version compare ────────────────────────────────────────

  async comparePromptVersions(idA: string, idB: string) {
    const [a, b] = await Promise.all([
      this.getPromptVersion(idA),
      this.getPromptVersion(idB),
    ]);

    const diff = this.lineDiff(a.content, b.content);

    return {
      a: { id: a.id, name: a.name, versionNo: a.versionNo, isActive: a.isActive, createdAt: a.createdAt },
      b: { id: b.id, name: b.name, versionNo: b.versionNo, isActive: b.isActive, createdAt: b.createdAt },
      diff,
      changed: diff.some((line) => line.type !== 'equal'),
    };
  }

  private lineDiff(
    contentA: string,
    contentB: string,
  ): { type: 'equal' | 'removed' | 'added'; line: string }[] {
    const linesA = contentA.split('\n');
    const linesB = contentB.split('\n');
    const result: { type: 'equal' | 'removed' | 'added'; line: string }[] = [];

    const maxLen = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLen; i++) {
      const la = linesA[i];
      const lb = linesB[i];
      if (la === lb) {
        result.push({ type: 'equal', line: la ?? '' });
      } else {
        if (la !== undefined) result.push({ type: 'removed', line: la });
        if (lb !== undefined) result.push({ type: 'added', line: lb });
      }
    }
    return result;
  }

  // ─── A3.5 Cost dashboard aggregation ────────────────────────────────────

  async getCostDashboard(projectId: string | null, period: 'day' | 'week' | 'month' = 'month') {
    const since = this.periodStart(period);

    const logs = await this.prisma.aiCallLog.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        createdAt: { gte: since },
      },
      select: {
        provider: true,
        model: true,
        skillName: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costUsd: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // By provider+model
    const byModel = new Map<string, { provider: string; model: string; calls: number; costUsd: number; totalTokens: number; errors: number }>();
    // By skill
    const bySkill = new Map<string, { skillName: string; calls: number; costUsd: number; errors: number }>();
    // Daily series
    const dailyMap = new Map<string, { date: string; calls: number; costUsd: number }>();

    for (const log of logs) {
      // model breakdown
      const mKey = `${log.provider}::${log.model}`;
      const mVal = byModel.get(mKey) ?? { provider: log.provider, model: log.model, calls: 0, costUsd: 0, totalTokens: 0, errors: 0 };
      mVal.calls++;
      mVal.costUsd += log.costUsd ?? 0;
      mVal.totalTokens += log.totalTokens ?? 0;
      if (log.status !== 'SUCCEEDED') mVal.errors++;
      byModel.set(mKey, mVal);

      // skill breakdown
      const sKey = log.skillName ?? 'unknown';
      const sVal = bySkill.get(sKey) ?? { skillName: sKey, calls: 0, costUsd: 0, errors: 0 };
      sVal.calls++;
      sVal.costUsd += log.costUsd ?? 0;
      if (log.status !== 'SUCCEEDED') sVal.errors++;
      bySkill.set(sKey, sVal);

      // daily series
      const day = log.createdAt.toISOString().slice(0, 10);
      const dVal = dailyMap.get(day) ?? { date: day, calls: 0, costUsd: 0 };
      dVal.calls++;
      dVal.costUsd += log.costUsd ?? 0;
      dailyMap.set(day, dVal);
    }

    const totalCostUsd = logs.reduce((s, l) => s + (l.costUsd ?? 0), 0);
    const totalTokens = logs.reduce((s, l) => s + (l.totalTokens ?? 0), 0);
    const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

    return {
      projectId: projectId ?? 'global',
      period,
      since: since.toISOString(),
      totalCostUsd: round6(totalCostUsd),
      totalCalls: logs.length,
      totalTokens,
      byModel: Array.from(byModel.values()).map((v) => ({ ...v, costUsd: round6(v.costUsd) })),
      bySkill: Array.from(bySkill.values()).map((v) => ({ ...v, costUsd: round6(v.costUsd) })),
      dailySeries: Array.from(dailyMap.values()).map((v) => ({ ...v, costUsd: round6(v.costUsd) })),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private periodStart(period: 'day' | 'week' | 'month'): Date {
    const d = new Date();
    if (period === 'day') d.setDate(d.getDate() - 1);
    else if (period === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    return d;
  }
}

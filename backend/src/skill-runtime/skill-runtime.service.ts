import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiGatewayService,
  CallSkillResponse,
} from '../ai-gateway/ai-gateway.service';
import { PrismaService } from '../prisma/prisma.service';

export interface RunSkillParams<T> {
  skillName: string;
  projectId?: string;
  variables?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  defaultPrompt: string;
  fallback: () => T | Promise<T>;
}

export interface RunSkillResult<T> {
  output: T;
  source: 'ai' | 'stub';
  provider?: string;
  model?: string;
  promptVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

@Injectable()
export class SkillRuntimeService {
  private readonly logger = new Logger(SkillRuntimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
    private readonly configService: ConfigService,
  ) {}

  async run<T>(params: RunSkillParams<T>): Promise<RunSkillResult<T>> {
    const activePrompt = await this.prisma.promptVersion.findFirst({
      where: { name: params.skillName, isActive: true },
    });

    const primaryProvider = this.detectPrimaryProvider();

    if (!activePrompt || !primaryProvider) {
      // Stub mode — still log marker call for cost analytics
      await this.logStubCall(params);
      return {
        output: await params.fallback(),
        source: 'stub',
      };
    }

    const prompt = this.interpolate(activePrompt.content, params.variables);
    const promptVersionLabel = `${activePrompt.name}@v${activePrompt.versionNo}`;

    try {
      const result: CallSkillResponse =
        await this.aiGateway.callSkillWithFallback({
          primaryProvider: primaryProvider.name,
          primaryModel: primaryProvider.model,
          fallbackProvider: this.detectFallbackProvider()?.name,
          fallbackModel: this.detectFallbackProvider()?.model,
          prompt,
          outputSchema: params.outputSchema,
          projectId: params.projectId,
          skillName: params.skillName,
          promptVersion: promptVersionLabel,
        });

      return {
        output: result.output as T,
        source: 'ai',
        provider: result.provider,
        model: result.model,
        promptVersion: promptVersionLabel,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      };
    } catch (err) {
      this.logger.error(
        `Skill ${params.skillName} failed via AI: ${String(err)}`,
      );
      // Re-throw so the caller surfaces a real error to the user instead of
      // silently returning dummy data that looks like a successful result.
      throw err;
    }
  }

  private interpolate(
    template: string,
    variables?: Record<string, unknown>,
  ): string {
    if (!variables) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const v = variables[key];
      if (v === undefined) return `{{${key}}}`;
      return typeof v === 'string' ? v : JSON.stringify(v);
    });
  }

  private detectPrimaryProvider(): { name: string; model: string } | null {
    if (this.configService.get<string>('OPENAI_API_KEY')) {
      return {
        name: 'openai',
        model:
          this.configService.get<string>('OPENAI_DEFAULT_MODEL') ??
          'gpt-4.1-mini',
      };
    }
    if (this.configService.get<string>('ANTHROPIC_API_KEY')) {
      return {
        name: 'anthropic',
        model:
          this.configService.get<string>('ANTHROPIC_DEFAULT_MODEL') ??
          'claude-haiku-4-5-20251001',
      };
    }
    return null;
  }

  private detectFallbackProvider(): { name: string; model: string } | null {
    const primary = this.detectPrimaryProvider();
    if (primary?.name === 'openai' && this.configService.get('ANTHROPIC_API_KEY')) {
      return {
        name: 'anthropic',
        model:
          this.configService.get<string>('ANTHROPIC_DEFAULT_MODEL') ??
          'claude-haiku-4-5-20251001',
      };
    }
    if (primary?.name === 'anthropic' && this.configService.get('OPENAI_API_KEY')) {
      return {
        name: 'openai',
        model:
          this.configService.get<string>('OPENAI_DEFAULT_MODEL') ??
          'gpt-4.1-mini',
      };
    }
    return null;
  }

  private async logStubCall<T>(params: RunSkillParams<T>): Promise<void> {
    await this.prisma.aiCallLog.create({
      data: {
        projectId: params.projectId,
        traceId: `trace_${params.skillName}_stub_${Date.now()}`,
        provider: 'stub',
        model: 'stub',
        skillName: params.skillName,
        skillVersion: 'v1',
        promptVersion: null,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        status: 'STUB',
      },
    });
  }
}

import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Ajv from 'ajv';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SecretsService } from '../secrets/secrets.service';
import {
  AI_PROVIDER_ADAPTERS,
  AIProviderAdapter,
} from './adapters/ai-provider.adapter';

export interface CallSkillOptions {
  primaryProvider: string;
  primaryModel: string;
  fallbackProvider?: string;
  fallbackModel?: string;
  prompt: string;
  outputSchema?: Record<string, unknown>;
  maxRetries?: number;
  projectId?: string;
  skillName?: string;
  promptVersion?: string;
}

export interface CallSkillResponse {
  output: unknown;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  repaired: boolean;
  usedFallback: boolean;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly ajv = new Ajv({ allErrors: true });
  private readonly adapters: Map<string, AIProviderAdapter>;

  constructor(
    @Inject(AI_PROVIDER_ADAPTERS)
    adapters: AIProviderAdapter[],
    private readonly secretsService: SecretsService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.adapters = new Map(
      adapters.map((adapter) => [adapter.provider, adapter]),
    );
  }

  getActiveProvider(): { provider: string | null; model: string | null } {
    const checks: Array<{ key: string; provider: string; modelKey: string; defaultModel: string }> = [
      { key: 'OLLAMA_API_KEY',      provider: 'ollama',      modelKey: 'OLLAMA_DEFAULT_MODEL',      defaultModel: 'gemma3:4b' },
      { key: 'OPENROUTER_API_KEY',  provider: 'openrouter',  modelKey: 'OPENROUTER_DEFAULT_MODEL',  defaultModel: 'meta-llama/llama-3.1-8b-instruct:free' },
      { key: 'GROQ_API_KEY',        provider: 'groq',        modelKey: 'GROQ_DEFAULT_MODEL',        defaultModel: 'llama-3.3-70b-versatile' },
      { key: 'GEMINI_API_KEY',      provider: 'gemini',      modelKey: 'GEMINI_DEFAULT_MODEL',      defaultModel: 'gemini-2.0-flash' },
      { key: 'ANTHROPIC_API_KEY',   provider: 'anthropic',   modelKey: 'ANTHROPIC_DEFAULT_MODEL',   defaultModel: 'claude-haiku-4-5-20251001' },
      { key: 'OPENAI_API_KEY',      provider: 'openai',      modelKey: 'OPENAI_DEFAULT_MODEL',      defaultModel: 'gpt-4o-mini' },
    ];
    for (const c of checks) {
      if (this.configService.get<string>(c.key)) {
        return { provider: c.provider, model: this.configService.get<string>(c.modelKey) ?? c.defaultModel };
      }
    }
    return { provider: null, model: null };
  }

  async testConnection(providerId: string) {
    const adapter = this.getAdapter(providerId);
    const result = await adapter.testConnection();

    return {
      ...result,
      secretRef: this.secretsService.mask(adapter.secretRef),
    };
  }

  async callSkillWithFallback(
    options: CallSkillOptions,
  ): Promise<CallSkillResponse> {
    const maxRetries = options.maxRetries ?? 2;
    const primary = this.getAdapter(options.primaryProvider);
    const attempts: string[] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const result = await primary.callSkill({
          prompt: options.prompt,
          model: options.primaryModel,
        });
        inputTokens += result.inputTokens;
        outputTokens += result.outputTokens;
        attempts.push(`primary#${attempt + 1}:ok_call`);

        const validated = this.parseAndValidate(
          result.content,
          options.outputSchema,
        );
        if (validated.ok) {
          await this.logAiCall({
            options,
            provider: options.primaryProvider,
            model: options.primaryModel,
            inputTokens,
            outputTokens,
            status: 'SUCCEEDED',
            errorReason: attempts.length > 1 ? attempts.join(' | ') : undefined,
          });
          return {
            output: validated.data,
            provider: options.primaryProvider,
            model: options.primaryModel,
            inputTokens,
            outputTokens,
            repaired: attempt > 0,
            usedFallback: false,
          };
        }

        attempts.push(`primary#${attempt + 1}:invalid_schema`);
        if (attempt < maxRetries) {
          this.logger.warn(
            `Schema validation failed (attempt ${attempt + 1}), trying auto-repair`,
          );
          const repaired = await primary.callSkill({
            prompt: this.buildRepairPrompt(
              result.content,
              options.outputSchema,
              validated.errors,
            ),
            model: options.primaryModel,
          });
          inputTokens += repaired.inputTokens;
          outputTokens += repaired.outputTokens;
          attempts.push(`primary#${attempt + 1}:repair_attempt`);

          const revalidated = this.parseAndValidate(
            repaired.content,
            options.outputSchema,
          );
          if (revalidated.ok) {
            await this.logAiCall({
              options,
              provider: options.primaryProvider,
              model: options.primaryModel,
              inputTokens,
              outputTokens,
              status: 'SUCCEEDED',
              errorReason: attempts.join(' | '),
            });
            return {
              output: revalidated.data,
              provider: options.primaryProvider,
              model: options.primaryModel,
              inputTokens,
              outputTokens,
              repaired: true,
              usedFallback: false,
            };
          }
          lastError = new Error(
            `Schema still invalid after repair: ${JSON.stringify(revalidated.errors)}`,
          );
        } else {
          lastError = new Error(
            `Schema validation failed: ${JSON.stringify(validated.errors)}`,
          );
        }
      } catch (err) {
        lastError = err;
        attempts.push(
          `primary#${attempt + 1}:error(${err instanceof Error ? err.message : String(err)})`,
        );
        this.logger.warn(
          `Primary provider attempt ${attempt + 1} failed: ${String(err)}`,
        );
      }
    }

    if (options.fallbackProvider && options.fallbackModel) {
      this.logger.warn(
        `Falling back to ${options.fallbackProvider}/${options.fallbackModel}`,
      );
      try {
        const fallback = this.getAdapter(options.fallbackProvider);
        const result = await fallback.callSkill({
          prompt: options.prompt,
          model: options.fallbackModel,
        });
        inputTokens += result.inputTokens;
        outputTokens += result.outputTokens;
        attempts.push('fallback:ok_call');

        const validated = this.parseAndValidate(
          result.content,
          options.outputSchema,
        );
        if (validated.ok) {
          await this.logAiCall({
            options,
            provider: options.fallbackProvider,
            model: options.fallbackModel,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            status: 'SUCCEEDED',
            errorReason: attempts.join(' | '),
          });
          return {
            output: validated.data,
            provider: options.fallbackProvider,
            model: options.fallbackModel,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            repaired: false,
            usedFallback: true,
          };
        }

        attempts.push('fallback:invalid_schema');
        lastError = new Error(
          `Fallback schema validation failed: ${JSON.stringify(validated.errors)}`,
        );
        await this.logAiCall({
          options,
          provider: options.fallbackProvider,
          model: options.fallbackModel,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          status: 'FAILED',
          errorReason: attempts.join(' | '),
        });
      } catch (err) {
        lastError = err;
        attempts.push(
          `fallback:error(${err instanceof Error ? err.message : String(err)})`,
        );
        await this.logAiCall({
          options,
          provider: options.fallbackProvider,
          model: options.fallbackModel,
          inputTokens: 0,
          outputTokens: 0,
          status: 'FAILED',
          errorReason: attempts.join(' | '),
        });
        this.logger.error(`Fallback provider also failed: ${String(err)}`);
      }
    } else {
      await this.logAiCall({
        options,
        provider: options.primaryProvider,
        model: options.primaryModel,
        inputTokens,
        outputTokens,
        status: 'FAILED',
        errorReason: attempts.join(' | '),
      });
    }

    throw new ServiceUnavailableException(
      `AI skill call failed after retries and fallback. Last error: ${String(lastError)}`,
    );
  }

  private parseAndValidate(
    content: string,
    schema?: Record<string, unknown>,
  ): { ok: true; data: unknown } | { ok: false; errors: unknown } {
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch {
      return { ok: false, errors: 'Invalid JSON' };
    }

    if (!schema) return { ok: true, data };

    const validate = this.ajv.compile(schema);
    if (validate(data)) return { ok: true, data };

    return { ok: false, errors: validate.errors };
  }

  private buildRepairPrompt(
    invalidContent: string,
    schema: Record<string, unknown> | undefined,
    errors: unknown,
  ): string {
    return [
      'The following JSON output is invalid. Fix it so it strictly matches the schema.',
      'Return only valid JSON; no markdown and no explanation.',
      '',
      `Validation errors: ${JSON.stringify(errors)}`,
      schema ? `Required schema: ${JSON.stringify(schema)}` : '',
      '',
      `Invalid JSON to fix:\n${invalidContent}`,
    ].join('\n');
  }

  private logAiCall({
    options,
    provider,
    model,
    inputTokens,
    outputTokens,
    status,
    errorReason,
  }: {
    options: CallSkillOptions;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    status: string;
    errorReason?: string;
  }) {
    const totalTokens = inputTokens + outputTokens;
    return this.prisma.aiCallLog.create({
      data: {
        projectId: options.projectId,
        traceId: `trace_${options.skillName ?? 'skill'}_${Date.now()}`,
        provider,
        model,
        skillName: options.skillName ?? 'skill_runtime',
        skillVersion: 'v1',
        promptVersion: options.promptVersion,
        inputTokens,
        outputTokens,
        totalTokens,
        costUsd: this.estimateCostUsd(model, inputTokens, outputTokens),
        status,
        errorReason,
      },
    });
  }

  private estimateCostUsd(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ) {
    const rates = this.modelRates(model);
    return (
      (inputTokens / 1_000_000) * rates.inputUsdPerMillion +
      (outputTokens / 1_000_000) * rates.outputUsdPerMillion
    );
  }

  private modelRates(model: string) {
    if (model.includes('gpt-4.1-mini')) {
      return { inputUsdPerMillion: 0.4, outputUsdPerMillion: 1.6 };
    }
    if (model.includes('gpt-4.1')) {
      return { inputUsdPerMillion: 2, outputUsdPerMillion: 8 };
    }
    if (model.includes('gpt-4o-mini')) {
      return { inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6 };
    }
    if (model.includes('gpt-4o')) {
      return { inputUsdPerMillion: 2.5, outputUsdPerMillion: 10 };
    }
    if (model.includes('haiku')) {
      return { inputUsdPerMillion: 0.8, outputUsdPerMillion: 4 };
    }
    if (model.includes('sonnet')) {
      return { inputUsdPerMillion: 3, outputUsdPerMillion: 15 };
    }
    if (model.includes('opus')) {
      return { inputUsdPerMillion: 15, outputUsdPerMillion: 75 };
    }
    return { inputUsdPerMillion: 0, outputUsdPerMillion: 0 };
  }

  private getAdapter(providerId: string) {
    const adapter = this.adapters.get(providerId);

    if (!adapter) {
      throw new NotFoundException(
        `AI provider ${providerId} is not configured`,
      );
    }

    return adapter;
  }
}

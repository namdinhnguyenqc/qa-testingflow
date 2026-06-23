import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsService } from '../../secrets/secrets.service';
import {
  AIProviderAdapter,
  CallSkillParams,
  CallSkillResult,
  TestConnectionResult,
} from './ai-provider.adapter';

interface OpenAIModelListResponse {
  data?: Array<{ id?: string }>;
  error?: { message?: string };
}

@Injectable()
export class OpenAIAdapter implements AIProviderAdapter {
  readonly provider = 'openai';
  readonly secretRef = 'env:OPENAI_API_KEY';

  constructor(
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
  ) {}

  async testConnection(): Promise<TestConnectionResult> {
    const apiKey = this.secretsService.resolve(this.secretRef);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const body = (await response
        .json()
        .catch(() => ({}))) as OpenAIModelListResponse;

      if (response.status === 401) {
        throw new UnauthorizedException('OpenAI API key is invalid');
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(
          body.error?.message ?? 'OpenAI connection test failed',
        );
      }

      const configuredModel = this.configService.get<string>(
        'OPENAI_DEFAULT_MODEL',
      );
      const models = (body.data ?? [])
        .map((model) => model.id)
        .filter((model): model is string => this.isSupportedQaModel(model))
        .sort();

      return {
        ok: true,
        provider: this.provider,
        models: configuredModel
          ? [
              configuredModel,
              ...models.filter((model) => model !== configuredModel),
            ]
          : models,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('OpenAI API request timed out');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async callSkill(params: CallSkillParams): Promise<CallSkillResult> {
    const apiKey = this.secretsService.resolve(this.secretRef);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    interface OpenAIChatResponse {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      error?: { message?: string };
    }

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: params.model,
            messages: [{ role: 'user', content: params.prompt }],
            max_tokens: params.maxTokens ?? 4096,
            temperature: params.temperature ?? 0.2,
            response_format: { type: 'json_object' },
          }),
        },
      );

      const body = (await response
        .json()
        .catch(() => ({}))) as OpenAIChatResponse;

      if (!response.ok) {
        throw new ServiceUnavailableException(
          body.error?.message ?? `OpenAI call failed: ${response.status}`,
        );
      }

      return {
        content: body.choices?.[0]?.message?.content ?? '{}',
        inputTokens: body.usage?.prompt_tokens ?? 0,
        outputTokens: body.usage?.completion_tokens ?? 0,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('OpenAI API request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isSupportedQaModel(model?: string): model is string {
    return Boolean(
      model &&
      (model.startsWith('gpt-') ||
        model.startsWith('o1') ||
        model.startsWith('o3') ||
        model.startsWith('o4')),
    );
  }
}

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

interface AnthropicMessageResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { type?: string; message?: string };
}

@Injectable()
export class AnthropicAdapter implements AIProviderAdapter {
  readonly provider = 'anthropic';
  readonly secretRef = 'env:ANTHROPIC_API_KEY';

  constructor(
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
  ) {}

  async testConnection(): Promise<TestConnectionResult> {
    const apiKey = this.secretsService.resolve(this.secretRef);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model:
            this.configService.get<string>('ANTHROPIC_DEFAULT_MODEL') ??
            'claude-haiku-4-5-20251001',
          max_tokens: 8,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      const body = (await response
        .json()
        .catch(() => ({}))) as AnthropicMessageResponse;

      if (response.status === 401) {
        throw new UnauthorizedException('Anthropic API key is invalid');
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(
          body.error?.message ?? 'Anthropic connection test failed',
        );
      }

      const defaultModel =
        this.configService.get<string>('ANTHROPIC_DEFAULT_MODEL') ??
        'claude-sonnet-4-6';

      return {
        ok: true,
        provider: this.provider,
        models: [defaultModel, 'claude-haiku-4-5-20251001', 'claude-opus-4-8'],
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'Anthropic API request timed out',
        );
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

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model,
          max_tokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.2,
          messages: [
            {
              role: 'user',
              content: `${params.prompt}\n\nRespond with valid JSON only. No markdown, no explanations.`,
            },
          ],
        }),
      });

      const body = (await response
        .json()
        .catch(() => ({}))) as AnthropicMessageResponse;

      if (!response.ok) {
        throw new ServiceUnavailableException(
          body.error?.message ?? `Anthropic call failed: ${response.status}`,
        );
      }

      const text = body.content?.find((c) => c.type === 'text')?.text ?? '{}';

      return {
        content: text,
        inputTokens: body.usage?.input_tokens ?? 0,
        outputTokens: body.usage?.output_tokens ?? 0,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'Anthropic API request timed out',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

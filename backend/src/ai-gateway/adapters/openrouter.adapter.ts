import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProviderAdapter,
  CallSkillParams,
  CallSkillResult,
  TestConnectionResult,
} from './ai-provider.adapter';

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string; code?: number };
}

@Injectable()
export class OpenRouterAdapter implements AIProviderAdapter {
  readonly provider = 'openrouter';
  readonly secretRef = 'env:OPENROUTER_API_KEY';

  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    const key = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!key) throw new ServiceUnavailableException('OPENROUTER_API_KEY is not configured');
    return key;
  }

  async testConnection(): Promise<TestConnectionResult> {
    const res = await fetch(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 401) throw new UnauthorizedException('OpenRouter API key is invalid');
    if (!res.ok) throw new ServiceUnavailableException('OpenRouter connection failed');
    return {
      ok: true,
      provider: this.provider,
      models: ['meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free', 'mistralai/mistral-7b-instruct:free'],
    };
  }

  async callSkill(params: CallSkillParams): Promise<CallSkillResult> {
    const model = params.model
      ?? this.configService.get('OPENROUTER_DEFAULT_MODEL')
      ?? 'meta-llama/llama-3.1-8b-instruct:free';

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI QA Platform',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: params.maxTokens ?? 8192,
        temperature: params.temperature ?? 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const body = (await res.json().catch(() => ({}))) as ChatResponse;

    if (!res.ok) {
      if (res.status === 401) throw new UnauthorizedException('OpenRouter API key is invalid');
      throw new ServiceUnavailableException(body.error?.message ?? `OpenRouter error: ${res.status}`);
    }

    return {
      content: body.choices?.[0]?.message?.content ?? '{}',
      inputTokens: body.usage?.prompt_tokens ?? 0,
      outputTokens: body.usage?.completion_tokens ?? 0,
    };
  }
}

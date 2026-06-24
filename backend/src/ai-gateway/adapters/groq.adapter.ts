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

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string; code?: string };
}

@Injectable()
export class GroqAdapter implements AIProviderAdapter {
  readonly provider = 'groq';
  readonly secretRef = 'env:GROQ_API_KEY';

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    const key = this.configService.get<string>('GROQ_API_KEY');
    if (!key) throw new ServiceUnavailableException('GROQ_API_KEY is not configured');
    return key;
  }

  async testConnection(): Promise<TestConnectionResult> {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { data?: Array<{ id: string }>; error?: { message: string } };
    if (res.status === 401) throw new UnauthorizedException('Groq API key is invalid');
    if (!res.ok) throw new ServiceUnavailableException(body.error?.message ?? 'Groq connection failed');
    return {
      ok: true,
      provider: this.provider,
      models: (body.data ?? []).map((m) => m.id).filter((id) => id.includes('llama') || id.includes('mixtral') || id.includes('gemma')),
    };
  }

  async callSkill(params: CallSkillParams): Promise<CallSkillResult> {
    const model = params.model ?? this.configService.get('GROQ_DEFAULT_MODEL') ?? 'llama-3.3-70b-versatile';

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
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

    const body = (await res.json().catch(() => ({}))) as GroqChatResponse;

    if (!res.ok) {
      if (res.status === 401) throw new UnauthorizedException('Groq API key is invalid');
      throw new ServiceUnavailableException(body.error?.message ?? `Groq error: ${res.status}`);
    }

    return {
      content: body.choices?.[0]?.message?.content ?? '{}',
      inputTokens: body.usage?.prompt_tokens ?? 0,
      outputTokens: body.usage?.completion_tokens ?? 0,
    };
  }
}

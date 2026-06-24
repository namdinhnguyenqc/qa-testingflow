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

interface OllamaChatResponse {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
}

@Injectable()
export class OllamaAdapter implements AIProviderAdapter {
  readonly provider = 'ollama';
  readonly secretRef = 'env:OLLAMA_API_KEY';

  private readonly baseUrl = 'https://api.ollama.com';

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    const key = this.configService.get<string>('OLLAMA_API_KEY');
    if (!key) throw new ServiceUnavailableException('OLLAMA_API_KEY is not configured');
    return key;
  }

  private get defaultModel(): string {
    return this.configService.get<string>('OLLAMA_DEFAULT_MODEL') ?? 'gemma3:4b';
  }

  async testConnection(): Promise<TestConnectionResult> {
    const res = await fetch(`${this.baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 401) throw new UnauthorizedException('Ollama API key is invalid');
    if (!res.ok) throw new ServiceUnavailableException('Ollama connection failed');
    const body = (await res.json()) as { data?: Array<{ id: string }> };
    return {
      ok: true,
      provider: this.provider,
      models: (body.data ?? []).map((m) => m.id).slice(0, 10),
    };
  }

  async callSkill(params: CallSkillParams): Promise<CallSkillResult> {
    const model = params.model ?? this.defaultModel;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: params.prompt }],
        stream: false,
        format: 'json',
        options: { temperature: params.temperature ?? 0.2 },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    const body = (await res.json().catch(() => ({}))) as OllamaChatResponse;

    if (!res.ok) {
      if (res.status === 401) throw new UnauthorizedException('Ollama API key is invalid');
      throw new ServiceUnavailableException(body.error ?? `Ollama error: ${res.status}`);
    }

    const raw = body.message?.content ?? '{}';
    // Strip markdown code fences if present
    const content = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    return {
      content,
      inputTokens: body.prompt_eval_count ?? 0,
      outputTokens: body.eval_count ?? 0,
    };
  }
}

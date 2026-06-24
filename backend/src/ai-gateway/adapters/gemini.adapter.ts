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

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { message?: string; code?: number };
}

@Injectable()
export class GeminiAdapter implements AIProviderAdapter {
  readonly provider = 'gemini';
  readonly secretRef = 'env:GEMINI_API_KEY';

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    const key = this.configService.get<string>('GEMINI_API_KEY');
    if (!key) throw new ServiceUnavailableException('GEMINI_API_KEY is not configured');
    return key;
  }

  private baseUrl(model: string, action = 'generateContent') {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}?key=${this.apiKey}`;
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const res = await fetch(this.baseUrl('gemini-2.0-flash'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with JSON: {"ok":true}' }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16 },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await res.json().catch(() => ({}))) as GeminiResponse;
      if (body.error) {
        if (body.error.code === 401 || body.error.code === 403)
          throw new UnauthorizedException(`Gemini: ${body.error.message}`);
        throw new ServiceUnavailableException(`Gemini: ${body.error.message}`);
      }
      return {
        ok: true,
        provider: this.provider,
        models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      };
    } catch (err) {
      if (err instanceof ServiceUnavailableException || err instanceof UnauthorizedException) throw err;
      throw new ServiceUnavailableException(`Gemini connection failed: ${String(err)}`);
    }
  }

  async callSkill(params: CallSkillParams): Promise<CallSkillResult> {
    const model = params.model ?? this.configService.get('GEMINI_DEFAULT_MODEL') ?? 'gemini-2.0-flash';

    const res = await fetch(this.baseUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: params.prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: params.temperature ?? 0.2,
          maxOutputTokens: params.maxTokens ?? 8192,
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const body = (await res.json().catch(() => ({}))) as GeminiResponse;

    if (body.error) {
      if (body.error.code === 401 || body.error.code === 403)
        throw new UnauthorizedException(`Gemini auth error: ${body.error.message}`);
      throw new ServiceUnavailableException(`Gemini API error: ${body.error.message}`);
    }

    const content = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    return {
      content,
      inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}

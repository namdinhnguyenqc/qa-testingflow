export interface TestConnectionResult {
  ok: boolean;
  provider: string;
  models: string[];
}

export interface CallSkillParams {
  prompt: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CallSkillResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AIProviderAdapter {
  readonly provider: string;
  readonly secretRef: string;
  testConnection(): Promise<TestConnectionResult>;
  callSkill(params: CallSkillParams): Promise<CallSkillResult>;
}

export const AI_PROVIDER_ADAPTERS = Symbol('AI_PROVIDER_ADAPTERS');

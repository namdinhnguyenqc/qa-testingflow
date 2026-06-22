export interface TestConnectionResult {
  ok: boolean;
  provider: string;
  models: string[];
}

export interface AIProviderAdapter {
  readonly provider: string;
  readonly secretRef: string;
  testConnection(): Promise<TestConnectionResult>;
}

export const AI_PROVIDER_ADAPTERS = Symbol('AI_PROVIDER_ADAPTERS');

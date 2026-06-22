import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SecretsService } from '../secrets/secrets.service';
import {
  AI_PROVIDER_ADAPTERS,
  AIProviderAdapter,
} from './adapters/ai-provider.adapter';

@Injectable()
export class AiGatewayService {
  private readonly adapters: Map<string, AIProviderAdapter>;

  constructor(
    @Inject(AI_PROVIDER_ADAPTERS)
    adapters: AIProviderAdapter[],
    private readonly secretsService: SecretsService,
  ) {
    this.adapters = new Map(
      adapters.map((adapter) => [adapter.provider, adapter]),
    );
  }

  async testConnection(providerId: string) {
    const adapter = this.getAdapter(providerId);
    const result = await adapter.testConnection();

    return {
      ...result,
      secretRef: this.secretsService.mask(adapter.secretRef),
    };
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

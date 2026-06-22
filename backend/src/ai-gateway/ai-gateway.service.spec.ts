import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SecretsService } from '../secrets/secrets.service';
import { AiGatewayService } from './ai-gateway.service';
import { AI_PROVIDER_ADAPTERS } from './adapters/ai-provider.adapter';

describe('AiGatewayService', () => {
  let service: AiGatewayService;
  const openAIAdapter = {
    provider: 'openai',
    secretRef: 'env:OPENAI_API_KEY',
    testConnection: jest.fn(),
  };
  const secretsService = {
    mask: jest.fn((value: string) => `masked:${value}`),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGatewayService,
        {
          provide: AI_PROVIDER_ADAPTERS,
          useValue: [openAIAdapter],
        },
        {
          provide: SecretsService,
          useValue: secretsService,
        },
      ],
    }).compile();

    service = module.get<AiGatewayService>(AiGatewayService);
  });

  it('tests OpenAI connection without exposing the secret', async () => {
    openAIAdapter.testConnection.mockResolvedValue({
      ok: true,
      provider: 'openai',
      models: ['gpt-4.1-mini'],
    });

    await expect(service.testConnection('openai')).resolves.toEqual({
      ok: true,
      provider: 'openai',
      models: ['gpt-4.1-mini'],
      secretRef: 'masked:env:OPENAI_API_KEY',
    });
  });

  it('rejects unknown providers', async () => {
    await expect(service.testConnection('unknown')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

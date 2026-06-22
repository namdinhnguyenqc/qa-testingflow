import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SecretsService } from './secrets.service';

describe('SecretsService', () => {
  let service: SecretsService;
  const configService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretsService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<SecretsService>(SecretsService);
  });

  it('resolves env secret refs', () => {
    configService.get.mockReturnValue('secret-value');

    expect(service.resolve('env:OPENAI_API_KEY')).toBe('secret-value');
    expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY');
  });

  it('masks values without exposing the full secret', () => {
    expect(service.mask('sk-test-secret-value')).toBe('sk-t...alue');
  });

  it('fully masks short values', () => {
    expect(service.mask('SK-1234-A')).toBe('********');
  });

  it('throws when a secret is missing', () => {
    configService.get.mockReturnValue(undefined);

    expect(() => service.resolve('env:OPENAI_API_KEY')).toThrow(
      NotFoundException,
    );
  });
});

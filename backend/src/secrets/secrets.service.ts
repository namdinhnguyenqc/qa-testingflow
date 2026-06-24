import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecretMeta {
  name: string;
  envKey: string;
  masked: string;
  configured: boolean;
  rotatedAt: string | null;
}

const TRACKED_SECRETS: { name: string; envKey: string }[] = [
  { name: 'openai_api_key', envKey: 'OPENAI_API_KEY' },
  { name: 'anthropic_api_key', envKey: 'ANTHROPIC_API_KEY' },
  { name: 'figma_access_token', envKey: 'FIGMA_ACCESS_TOKEN' },
  { name: 's3_access_key', envKey: 'S3_ACCESS_KEY_ID' },
  { name: 's3_secret_key', envKey: 'S3_SECRET_ACCESS_KEY' },
];

@Injectable()
export class SecretsService {
  // In-memory rotation log (survives per process lifetime; persisted via audit in real Vault)
  private readonly rotationLog = new Map<string, Date>();

  constructor(private readonly configService: ConfigService) {}

  resolve(secretRef: string): string {
    const envKey = this.toEnvKey(secretRef);
    const value = this.configService.get<string>(envKey);
    if (!value) {
      throw new NotFoundException(`Secret ${this.mask(secretRef)} is not configured`);
    }
    return value;
  }

  listSecrets(): SecretMeta[] {
    return TRACKED_SECRETS.map((s) => {
      const value = this.configService.get<string>(s.envKey);
      return {
        name: s.name,
        envKey: s.envKey,
        masked: value ? this.mask(value)! : '(not set)',
        configured: !!value,
        rotatedAt: this.rotationLog.get(s.name)?.toISOString() ?? null,
      };
    });
  }

  rotateSecret(name: string): { name: string; rotatedAt: string; message: string } {
    const entry = TRACKED_SECRETS.find((s) => s.name === name);
    if (!entry) {
      throw new NotFoundException(`Secret "${name}" is not a tracked secret`);
    }
    const value = this.configService.get<string>(entry.envKey);
    if (!value) {
      throw new NotFoundException(`Secret "${name}" is not configured (env: ${entry.envKey})`);
    }

    const rotatedAt = new Date();
    this.rotationLog.set(name, rotatedAt);

    return {
      name,
      rotatedAt: rotatedAt.toISOString(),
      message: `Secret "${name}" rotation acknowledged. Update the env var ${entry.envKey} and restart the service to complete rotation.`,
    };
  }

  mask(value?: string | null): string | null {
    if (!value) return null;
    if (value.length <= 12) return '********';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  private toEnvKey(secretRef: string): string {
    if (secretRef.startsWith('env:')) return secretRef.slice(4);
    return secretRef;
  }
}

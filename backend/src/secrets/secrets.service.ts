import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsService {
  constructor(private readonly configService: ConfigService) {}

  resolve(secretRef: string): string {
    const envKey = this.toEnvKey(secretRef);
    const value = this.configService.get<string>(envKey);

    if (!value) {
      throw new NotFoundException(
        `Secret ${this.mask(secretRef)} is not configured`,
      );
    }

    return value;
  }

  mask(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    if (value.length <= 12) {
      return '********';
    }

    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  private toEnvKey(secretRef: string): string {
    if (secretRef.startsWith('env:')) {
      return secretRef.slice(4);
    }

    return secretRef;
  }
}

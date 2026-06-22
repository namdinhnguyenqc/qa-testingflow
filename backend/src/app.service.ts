import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      ok: true,
      service: 'ai-qa-backend',
      timestamp: new Date().toISOString(),
    };
  }

  getConfigSummary() {
    const openAiKey = this.configService.get<string>('OPENAI_API_KEY');

    return {
      nodeEnv: this.configService.get<string>('NODE_ENV'),
      port: this.configService.get<number>('PORT'),
      databaseConfigured: Boolean(
        this.configService.get<string>('DATABASE_URL'),
      ),
      redis: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
      s3: {
        endpoint: this.configService.get<string>('S3_ENDPOINT'),
        bucket: this.configService.get<string>('S3_BUCKET'),
        forcePathStyle: this.configService.get<string>('S3_FORCE_PATH_STYLE'),
      },
      ai: {
        openAiConfigured: Boolean(openAiKey),
        defaultModel: this.configService.get<string>('OPENAI_DEFAULT_MODEL'),
      },
      defaults: {
        language: this.configService.get<string>('DEFAULT_LANGUAGE'),
        maxFileSizeMb: {
          doc: this.configService.get<string>('MAX_FILE_SIZE_DOC_MB'),
          xlsx: this.configService.get<string>('MAX_FILE_SIZE_XLSX_MB'),
          image: this.configService.get<string>('MAX_FILE_SIZE_IMAGE_MB'),
          global: this.configService.get<string>('MAX_FILE_SIZE_GLOBAL_MB'),
        },
      },
    };
  }
}

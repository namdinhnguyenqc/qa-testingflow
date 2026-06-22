import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { SecretsModule } from './secrets/secrets.module';
import { AiGatewayModule } from './ai-gateway/ai-gateway.module';
import { Phase1Module } from './phase1/phase1.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    PrismaModule,
    SecretsModule,
    AiGatewayModule,
    ProjectsModule,
    Phase1Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

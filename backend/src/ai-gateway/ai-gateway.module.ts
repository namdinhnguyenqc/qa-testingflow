import { Module } from '@nestjs/common';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { AI_PROVIDER_ADAPTERS } from './adapters/ai-provider.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AiGatewayController],
  providers: [
    AiGatewayService,
    OpenAIAdapter,
    AnthropicAdapter,
    {
      provide: AI_PROVIDER_ADAPTERS,
      useFactory: (
        openAIAdapter: OpenAIAdapter,
        anthropicAdapter: AnthropicAdapter,
      ) => [openAIAdapter, anthropicAdapter],
      inject: [OpenAIAdapter, AnthropicAdapter],
    },
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}

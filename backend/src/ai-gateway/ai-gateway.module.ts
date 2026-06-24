import { Module } from '@nestjs/common';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { AI_PROVIDER_ADAPTERS } from './adapters/ai-provider.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { GroqAdapter } from './adapters/groq.adapter';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AiGatewayController],
  providers: [
    AiGatewayService,
    OpenAIAdapter,
    AnthropicAdapter,
    GeminiAdapter,
    GroqAdapter,
    {
      provide: AI_PROVIDER_ADAPTERS,
      useFactory: (
        openAIAdapter: OpenAIAdapter,
        anthropicAdapter: AnthropicAdapter,
        geminiAdapter: GeminiAdapter,
        groqAdapter: GroqAdapter,
      ) => [openAIAdapter, anthropicAdapter, geminiAdapter, groqAdapter],
      inject: [OpenAIAdapter, AnthropicAdapter, GeminiAdapter, GroqAdapter],
    },
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}

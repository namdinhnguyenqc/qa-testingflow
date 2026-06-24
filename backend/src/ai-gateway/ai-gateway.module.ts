import { Module } from '@nestjs/common';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { AI_PROVIDER_ADAPTERS } from './adapters/ai-provider.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { GroqAdapter } from './adapters/groq.adapter';
import { OpenRouterAdapter } from './adapters/openrouter.adapter';
import { OllamaAdapter } from './adapters/ollama.adapter';
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
    OpenRouterAdapter,
    OllamaAdapter,
    {
      provide: AI_PROVIDER_ADAPTERS,
      useFactory: (
        openAIAdapter: OpenAIAdapter,
        anthropicAdapter: AnthropicAdapter,
        geminiAdapter: GeminiAdapter,
        groqAdapter: GroqAdapter,
        openRouterAdapter: OpenRouterAdapter,
        ollamaAdapter: OllamaAdapter,
      ) => [openAIAdapter, anthropicAdapter, geminiAdapter, groqAdapter, openRouterAdapter, ollamaAdapter],
      inject: [OpenAIAdapter, AnthropicAdapter, GeminiAdapter, GroqAdapter, OpenRouterAdapter, OllamaAdapter],
    },
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}

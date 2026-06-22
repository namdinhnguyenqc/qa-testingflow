import { Module } from '@nestjs/common';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { AI_PROVIDER_ADAPTERS } from './adapters/ai-provider.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';

@Module({
  controllers: [AiGatewayController],
  providers: [
    AiGatewayService,
    OpenAIAdapter,
    {
      provide: AI_PROVIDER_ADAPTERS,
      useFactory: (openAIAdapter: OpenAIAdapter) => [openAIAdapter],
      inject: [OpenAIAdapter],
    },
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}

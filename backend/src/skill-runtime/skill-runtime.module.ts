import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { SkillRuntimeService } from './skill-runtime.service';

@Module({
  imports: [AiGatewayModule],
  providers: [SkillRuntimeService],
  exports: [SkillRuntimeService],
})
export class SkillRuntimeModule {}

import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { Phase2Controller } from './phase2.controller';
import { Phase2Service } from './phase2.service';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [AuditModule, AiGatewayModule, AuthModule],
  controllers: [Phase2Controller],
  providers: [Phase2Service, EmbeddingService],
  exports: [EmbeddingService],
})
export class Phase2Module {}

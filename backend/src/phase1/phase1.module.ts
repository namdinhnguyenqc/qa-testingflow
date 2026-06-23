import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SkillRuntimeModule } from '../skill-runtime/skill-runtime.module';
import { Phase1Controller } from './phase1.controller';
import { Phase1Service } from './phase1.service';

@Module({
  imports: [AuditModule, SkillRuntimeModule],
  controllers: [Phase1Controller],
  providers: [Phase1Service],
})
export class Phase1Module {}

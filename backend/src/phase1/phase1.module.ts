import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ExporterModule } from '../exporter/exporter.module';
import { ParserModule } from '../parser/parser.module';
import { SkillRuntimeModule } from '../skill-runtime/skill-runtime.module';
import { StorageModule } from '../storage/storage.module';
import { Phase1Controller } from './phase1.controller';
import { Phase1Service } from './phase1.service';

@Module({
  imports: [AuditModule, SkillRuntimeModule, ParserModule, ExporterModule, StorageModule],
  controllers: [Phase1Controller],
  providers: [Phase1Service],
})
export class Phase1Module {}

import { Module } from '@nestjs/common';
import { Phase1Controller } from './phase1.controller';
import { Phase1Service } from './phase1.service';

@Module({
  controllers: [Phase1Controller],
  providers: [Phase1Service],
})
export class Phase1Module {}

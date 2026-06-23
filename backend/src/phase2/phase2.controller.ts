import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CostSummaryQueryDto,
  CreatePromptVersionDto,
  ReadFigmaDto,
  TestSkillDto,
  UpdateBudgetConfigDto,
  UpdateGateConfigDto,
} from './dto';
import { Phase2Service } from './phase2.service';

@ApiTags('phase2')
@UseGuards(AuthGuard)
@Roles('admin')
@Controller()
export class Phase2Controller {
  constructor(private readonly phase2Service: Phase2Service) {}

  // ─── Prompt versioning (A2.2) ─────────────────────────────────────────

  @Post('configs/prompt-versions')
  createPromptVersion(@Body() dto: CreatePromptVersionDto) {
    return this.phase2Service.createPromptVersion(dto);
  }

  @Get('configs/prompt-versions')
  listPromptVersions(@Query('name') name?: string) {
    return this.phase2Service.listPromptVersions(name);
  }

  @Get('configs/prompt-versions/:id')
  getPromptVersion(@Param('id') id: string) {
    return this.phase2Service.getPromptVersion(id);
  }

  @Post('configs/prompt-versions/:id/activate')
  @HttpCode(HttpStatus.OK)
  activatePromptVersion(@Param('id') id: string) {
    return this.phase2Service.activatePromptVersion(id);
  }

  // ─── Quality gate config (A2.4) ───────────────────────────────────────

  @Post('projects/:projectId/configs/gate')
  upsertGateConfig(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateGateConfigDto,
  ) {
    return this.phase2Service.upsertGateConfig(projectId, dto);
  }

  @Get('projects/:projectId/configs/gate')
  getGateConfig(@Param('projectId') projectId: string) {
    return this.phase2Service.getGateConfig(projectId);
  }

  // ─── Audit logs (A2.5) ────────────────────────────────────────────────

  @Get('audit-logs')
  listAuditLogs(
    @Query('projectId') projectId?: string,
    @Query('action') action?: string,
  ) {
    return this.phase2Service.listAuditLogs(projectId, action);
  }

  // ─── Cost tracking (A2.6) ─────────────────────────────────────────────

  @Get('cost-summary')
  getGlobalCostSummary(@Query() query: CostSummaryQueryDto) {
    return this.phase2Service.getCostSummary(null, query);
  }

  @Get('projects/:projectId/cost-summary')
  getCostSummary(
    @Param('projectId') projectId: string,
    @Query() query: CostSummaryQueryDto,
  ) {
    return this.phase2Service.getCostSummary(projectId, query);
  }

  @Get('projects/:projectId/budget-status')
  getBudgetStatus(@Param('projectId') projectId: string) {
    return this.phase2Service.getBudgetStatus(projectId);
  }

  @Post('projects/:projectId/configs/budget')
  upsertBudgetConfig(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateBudgetConfigDto,
  ) {
    return this.phase2Service.upsertBudgetConfig(projectId, dto);
  }

  // ─── Figma reader skill (A2.7) ────────────────────────────────────────

  @Post('skills/figma-reader')
  @HttpCode(HttpStatus.OK)
  readFigma(@Body() dto: ReadFigmaDto) {
    return this.phase2Service.readFigma(dto);
  }

  // ─── Test skill call / fallback chain (A2.1, A2.3) ───────────────────

  @Post('skills/test-call')
  @HttpCode(HttpStatus.OK)
  testSkillCall(@Body() dto: TestSkillDto) {
    return this.phase2Service.callSkillTest(dto);
  }
}

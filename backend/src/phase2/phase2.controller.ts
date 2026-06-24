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
import { SecretsService } from '../secrets/secrets.service';
import {
  CostSummaryQueryDto,
  CreatePromptVersionDto,
  ReadFigmaDto,
  TestSkillDto,
  UpdateBudgetConfigDto,
  UpdateGateConfigDto,
} from './dto';
import { EmbeddingService } from './embedding.service';
import { Phase2Service } from './phase2.service';

@ApiTags('phase2')
@UseGuards(AuthGuard)
@Roles('admin')
@Controller()
export class Phase2Controller {
  constructor(
    private readonly phase2Service: Phase2Service,
    private readonly embeddingService: EmbeddingService,
    private readonly secretsService: SecretsService,
  ) {}

  // ─── Prompt versioning (A2.2) ─────────────────────────────────────────

  @Post('configs/prompt-versions')
  createPromptVersion(@Body() dto: CreatePromptVersionDto) {
    return this.phase2Service.createPromptVersion(dto);
  }

  @Get('configs/prompt-versions')
  listPromptVersions(@Query('name') name?: string) {
    return this.phase2Service.listPromptVersions(name);
  }

  @Get('configs/prompt-versions/compare')
  comparePromptVersions(
    @Query('idA') idA: string,
    @Query('idB') idB: string,
  ) {
    return this.phase2Service.comparePromptVersions(idA, idB);
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

  // ─── A3.3 Workflow builder config ─────────────────────────────────────

  @Post('configs/workflow-versions')
  createWorkflowVersion(
    @Body() dto: { name: string; description?: string; definition: Record<string, unknown> },
  ) {
    return this.phase2Service.createWorkflowVersion(dto);
  }

  @Get('configs/workflow-versions')
  listWorkflowVersions(@Query('name') name?: string) {
    return this.phase2Service.listWorkflowVersions(name);
  }

  @Get('configs/workflow-versions/:id')
  getWorkflowVersion(@Param('id') id: string) {
    return this.phase2Service.getWorkflowVersion(id);
  }

  @Post('configs/workflow-versions/:id/activate')
  @HttpCode(HttpStatus.OK)
  activateWorkflowVersion(@Param('id') id: string) {
    return this.phase2Service.activateWorkflowVersion(id);
  }

  // ─── A3.5 Cost dashboard aggregation ─────────────────────────────────

  @Get('cost-dashboard')
  getGlobalCostDashboard(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.phase2Service.getCostDashboard(null, period);
  }

  @Get('projects/:projectId/cost-dashboard')
  getProjectCostDashboard(
    @Param('projectId') projectId: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.phase2Service.getCostDashboard(projectId, period);
  }

  // ─── A3.1 Secret management ───────────────────────────────────────────

  @Get('configs/secrets')
  listSecrets() {
    return this.secretsService.listSecrets();
  }

  @Post('configs/secrets/:name/rotate')
  @HttpCode(HttpStatus.OK)
  rotateSecret(@Param('name') name: string) {
    return this.secretsService.rotateSecret(name);
  }

  // ─── A3.2 pgvector semantic search ───────────────────────────────────

  @Post('requirements/versions/:id/embed')
  @HttpCode(HttpStatus.OK)
  embedRequirementVersion(@Param('id') id: string) {
    return this.embeddingService.embedRequirementVersion(id);
  }

  @Get('requirements/versions/:id/search')
  semanticSearch(
    @Param('id') id: string,
    @Query('q') query: string,
    @Query('topK') topK?: string,
  ) {
    return this.embeddingService.semanticSearch(id, query, topK ? Number(topK) : 10);
  }
}

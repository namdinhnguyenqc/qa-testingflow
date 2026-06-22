import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AnalyzeRequirementDto,
  ApproveDto,
  CreateArtifactDto,
  GenerateTestcasesDto,
  UpdateGapDto,
  UpdateTestCaseDto,
} from './dto';
import { Phase1Service } from './phase1.service';

@ApiTags('phase1')
@Controller()
export class Phase1Controller {
  constructor(private readonly phase1Service: Phase1Service) {}

  @Post('projects/:projectId/artifacts')
  createArtifact(
    @Param('projectId') projectId: string,
    @Body() dto: CreateArtifactDto,
  ) {
    return this.phase1Service.createArtifact(projectId, dto);
  }

  @Get('projects/:projectId/artifacts')
  listArtifacts(@Param('projectId') projectId: string) {
    return this.phase1Service.listArtifacts(projectId);
  }

  @Post('artifacts/:id/parse')
  @HttpCode(HttpStatus.ACCEPTED)
  parseArtifact(@Param('id') id: string) {
    return this.phase1Service.parseArtifact(id);
  }

  @Post('projects/:projectId/requirements/analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  analyzeRequirement(
    @Param('projectId') projectId: string,
    @Body() dto: AnalyzeRequirementDto,
  ) {
    return this.phase1Service.analyzeRequirement(projectId, dto);
  }

  @Get('requirements/versions/:id')
  getRequirementVersion(@Param('id') id: string) {
    return this.phase1Service.getRequirementVersion(id);
  }

  @Patch('requirements/versions/:id/items')
  updateRequirementItems(
    @Param('id') id: string,
    @Body() body: { items?: unknown[] },
  ) {
    return this.phase1Service.updateRequirementItems(id, body);
  }

  @Post('requirements/versions/:id/quality')
  @HttpCode(HttpStatus.ACCEPTED)
  queueQuality(@Param('id') id: string) {
    return this.phase1Service.queueQuality(id);
  }

  @Post('requirements/versions/:id/gaps')
  @HttpCode(HttpStatus.ACCEPTED)
  detectGaps(@Param('id') id: string) {
    return this.phase1Service.detectGaps(id);
  }

  @Get('requirements/versions/:id/gaps')
  listGaps(@Param('id') id: string) {
    return this.phase1Service.listGaps(id);
  }

  @Patch('gaps/:id')
  updateGap(@Param('id') id: string, @Body() dto: UpdateGapDto) {
    return this.phase1Service.updateGap(id, dto);
  }

  @Post('requirements/versions/:id/rewrite')
  @HttpCode(HttpStatus.ACCEPTED)
  rewriteRequirement(@Param('id') id: string) {
    return this.phase1Service.rewriteRequirement(id);
  }

  @Post('requirements/versions/:id/approve')
  approveRequirement(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.phase1Service.approveRequirement(id, dto);
  }

  @Post('requirements/versions/:id/testcase-sets')
  @HttpCode(HttpStatus.ACCEPTED)
  generateTestcases(
    @Param('id') id: string,
    @Body() dto: GenerateTestcasesDto,
  ) {
    return this.phase1Service.generateTestcases(id, dto);
  }

  @Get('testcase-sets/:id')
  getTestcaseSet(@Param('id') id: string) {
    return this.phase1Service.getTestcaseSet(id);
  }

  @Patch('test-cases/:id')
  updateTestCase(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.phase1Service.updateTestCase(id, dto);
  }

  @Post('testcase-sets/:id/coverage')
  @HttpCode(HttpStatus.ACCEPTED)
  checkCoverage(@Param('id') id: string) {
    return this.phase1Service.checkCoverage(id);
  }

  @Get('testcase-sets/:id/coverage')
  getCoverage(@Param('id') id: string) {
    return this.phase1Service.getCoverage(id);
  }

  @Post('testcase-sets/:id/exports/excel')
  @HttpCode(HttpStatus.ACCEPTED)
  exportExcel(@Param('id') id: string) {
    return this.phase1Service.exportExcel(id);
  }

  @Get('projects/:projectId/exports')
  listExports(@Param('projectId') projectId: string) {
    return this.phase1Service.listExports(projectId);
  }

  @Get('exports/:id/download')
  downloadExport(@Param('id') id: string) {
    return this.phase1Service.downloadExport(id);
  }

  @Get('workflow-runs/:id')
  getWorkflowRun(@Param('id') id: string) {
    return this.phase1Service.getWorkflowRun(id);
  }

  @Post('workflow-runs/:id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  retryWorkflowRun(@Param('id') id: string) {
    return this.phase1Service.retryWorkflowRun(id);
  }

  @Post('workflow-runs/:id/cancel')
  cancelWorkflowRun(@Param('id') id: string) {
    return this.phase1Service.cancelWorkflowRun(id);
  }

  @Get('projects/:projectId/ai-call-logs')
  listAiCallLogs(@Param('projectId') projectId: string) {
    return this.phase1Service.listAiCallLogs(projectId);
  }

  @Get('projects/:projectId/audit-logs')
  listAuditLogs(@Param('projectId') projectId: string) {
    return this.phase1Service.listAuditLogs(projectId);
  }
}

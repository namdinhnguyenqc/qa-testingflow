import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AiGatewayService } from './ai-gateway.service';
@ApiTags('ai-gateway')
@UseGuards(AuthGuard)
@Roles('admin')
@Controller('configs/ai-providers')
export class AiGatewayController {
  constructor(private readonly aiGatewayService: AiGatewayService) {}

  @Get('active')
  getActiveProvider() {
    return this.aiGatewayService.getActiveProvider();
  }

  @Post(':id/test-connection')
  @ApiOkResponse({ description: 'Provider connection status and available models' })
  testConnection(@Param('id') id: string) {
    return this.aiGatewayService.testConnection(id);
  }
}

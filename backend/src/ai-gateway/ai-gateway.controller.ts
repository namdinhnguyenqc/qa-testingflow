import { Controller, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AiGatewayService } from './ai-gateway.service';

@ApiTags('ai-gateway')
@Controller('configs/ai-providers')
export class AiGatewayController {
  constructor(private readonly aiGatewayService: AiGatewayService) {}

  @Post(':id/test-connection')
  @ApiOkResponse({
    description: 'Provider connection status and available models',
  })
  testConnection(@Param('id') id: string) {
    return this.aiGatewayService.testConnection(id);
  }
}

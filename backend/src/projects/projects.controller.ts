import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Project created' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Project list' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Project detail' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Project updated' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Project deleted' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}

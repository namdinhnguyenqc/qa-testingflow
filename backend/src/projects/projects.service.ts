import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../node_modules/.prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        defaultLanguage: dto.defaultLanguage ?? 'vi',
        configOverrides: dto.configOverrides as Prisma.InputJsonValue,
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} was not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          defaultLanguage: dto.defaultLanguage,
          configOverrides: dto.configOverrides as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.throwNotFoundOnMissingRecord(error, id);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      this.throwNotFoundOnMissingRecord(error, id);
      throw error;
    }

    return { deleted: true, id };
  }

  private throwNotFoundOnMissingRecord(error: unknown, id: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(`Project ${id} was not found`);
    }
  }
}

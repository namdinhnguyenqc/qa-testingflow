import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

const prismaMock = {
  project: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('creates a project with Vietnamese as the default language', async () => {
    prismaMock.project.create.mockResolvedValue({ id: 'project-id' });

    await service.create({ name: 'Demo' });

    expect(prismaMock.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Demo',
        description: undefined,
        defaultLanguage: 'vi',
        configOverrides: undefined,
      },
    });
  });

  it('throws not found when a project is missing', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

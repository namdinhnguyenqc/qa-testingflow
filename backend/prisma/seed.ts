import 'dotenv/config';
import { PrismaClient } from '../node_modules/.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  await prisma.project.upsert({
    where: { id: 'seed-project-local' },
    update: {},
    create: {
      id: 'seed-project-local',
      name: 'Local QA Demo',
      description: 'Seed project for local backend verification',
      defaultLanguage: 'vi',
      configOverrides: {
        gates: {
          requirement: {
            minQualityScore: 70,
            allowUserOverride: true,
          },
          coverage: {
            minCoveragePercent: 80,
            excludeNotTestable: true,
          },
        },
      },
    },
  });

  await prisma.configVersion.upsert({
    where: {
      projectId_name_versionNo: {
        projectId: 'seed-project-local',
        name: 'default-platform-config',
        versionNo: 1,
      },
    },
    update: {},
    create: {
      name: 'default-platform-config',
      projectId: 'seed-project-local',
      versionNo: 1,
      status: 'ACTIVE',
      contentJson: {
        defaultLanguage: 'vi',
        testcaseSetVersioning: true,
        fileLimitsMb: {
          image: 10,
          xlsx: 20,
          doc: 30,
          global: 30,
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

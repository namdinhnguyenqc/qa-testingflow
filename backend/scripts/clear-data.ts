import 'dotenv/config';
import { PrismaClient } from '../node_modules/.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  console.log('🧹 Clearing all dummy/junk data...\n');

  const d = await prisma.$transaction([
    prisma.aiCallLog.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.coverageItem.deleteMany({}),
    prisma.testCase.deleteMany({}),
    prisma.testcaseSet.deleteMany({}),
    prisma.workflowRun.deleteMany({}),
    prisma.gapItem.deleteMany({}),
    prisma.requirementItem.deleteMany({}),
    prisma.requirementVersion.deleteMany({}),
    prisma.exportArtifact.deleteMany({}),
    prisma.artifact.deleteMany({}),
    prisma.configVersion.deleteMany({}),
    prisma.project.deleteMany({}),
  ]);

  console.log(`✓ aiCallLog          deleted: ${d[0].count}`);
  console.log(`✓ auditLog           deleted: ${d[1].count}`);
  console.log(`✓ coverageItem       deleted: ${d[2].count}`);
  console.log(`✓ testCase           deleted: ${d[3].count}`);
  console.log(`✓ testcaseSet        deleted: ${d[4].count}`);
  console.log(`✓ workflowRun        deleted: ${d[5].count}`);
  console.log(`✓ gapItem            deleted: ${d[6].count}`);
  console.log(`✓ requirementItem    deleted: ${d[7].count}`);
  console.log(`✓ requirementVersion deleted: ${d[8].count}`);
  console.log(`✓ exportArtifact     deleted: ${d[9].count}`);
  console.log(`✓ artifact           deleted: ${d[10].count}`);
  console.log(`✓ configVersion      deleted: ${d[11].count}`);
  console.log(`✓ project            deleted: ${d[12].count}`);

  const users = await prisma.user.count();
  const prompts = await prisma.promptVersion.count();
  console.log(`\n✓ Kept: ${users} user(s), ${prompts} prompt version(s)`);
  console.log('\n✅ Done. DB is clean.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });

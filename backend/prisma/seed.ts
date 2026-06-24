import 'dotenv/config';
import { PrismaClient } from '../node_modules/.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash('Abc@1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('✓ Admin user seeded: admin@gmail.com');

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

  // Prompt versions for all Phase 1 skills
  const skills = [
    {
      name: 'requirement_reader',
      content: `You are a senior QA analyst. Parse the following requirement document into structured items.
Language: {{language}}

Source text:
{{sourceText}}

Return a JSON object with:
- "contentMarkdown": a clean markdown summary of the requirements
- "items": array of objects, each with:
  - "code": short unique code (e.g. REQ-001)
  - "title": short title
  - "description": full description
  - "priority": one of CRITICAL, HIGH, MEDIUM, LOW
  - "category": category name (e.g. Functional, Performance, Security)
  - "source": original source text excerpt

Return ONLY valid JSON, no markdown fences.`,
    },
    {
      name: 'gap_detector',
      content: `You are a QA analyst. Review the requirement items below and identify gaps, ambiguities, or missing requirements.

Requirements:
{{requirementMarkdown}}

Return a JSON object with:
- "gaps": array of objects, each with:
  - "title": short title of the gap
  - "description": detailed explanation
  - "severity": one of CRITICAL, HIGH, MEDIUM, LOW
  - "relatedItemCode": code of the related requirement item (or null)
  - "suggestion": suggested fix

Return ONLY valid JSON, no markdown fences.`,
    },
    {
      name: 'requirement_rewriter',
      content: `You are a senior business analyst. Rewrite the requirements below to be clear, complete, and testable.

Original requirements:
{{requirementMarkdown}}

Gaps identified:
{{gapsText}}

Return a JSON object with:
- "contentMarkdown": rewritten requirements in clean markdown
- "items": array with same structure as input, improved

Return ONLY valid JSON, no markdown fences.`,
    },
    {
      name: 'testcase_generator',
      content: `You are a QA engineer. Generate comprehensive test cases for the following requirements.

Requirements:
{{requirementMarkdown}}

Language: {{language}}

Return a JSON object with:
- "testCases": array of objects, each with:
  - "externalId": short ID (e.g. TC-001)
  - "title": test case title
  - "module": module/feature name
  - "priority": one of CRITICAL, HIGH, MEDIUM, LOW
  - "preconditions": string (setup needed)
  - "steps": array of step strings
  - "expectedResult": expected outcome string
  - "tags": array of tag strings

Return ONLY valid JSON, no markdown fences.`,
    },
    {
      name: 'coverage_checker',
      content: `You are a QA lead. Check test coverage for the following requirements and test cases.

Requirements:
{{requirementItems}}

Test cases:
{{testCases}}

Return a JSON object with:
- "coveragePercent": number (0-100)
- "matrix": array of objects, each with:
  - "requirementCode": requirement code
  - "requirementTitle": title
  - "coveredByTestcaseIds": array of test case IDs
  - "coverageStatus": one of COVERED, PARTIAL, NOT_COVERED

Return ONLY valid JSON, no markdown fences.`,
    },
  ];

  for (const skill of skills) {
    const existing = await prisma.promptVersion.findFirst({
      where: { name: skill.name, isActive: true },
    });
    if (!existing) {
      await prisma.promptVersion.create({
        data: {
          name: skill.name,
          content: skill.content,
          versionNo: 1,
          isActive: true,
        },
      });
      console.log(`✓ Prompt seeded & activated: ${skill.name}`);
    } else {
      console.log(`- Prompt already active: ${skill.name}`);
    }
  }

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

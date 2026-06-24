import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
// datasourceUrl must be provided explicitly when schema has no url field

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL } as any);
  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_requirement_items_embedding
       ON aiqa_dev.requirement_items
       USING ivfflat (embedding vector_cosine_ops)
       WITH (lists = 100)`,
    );
    console.log('ivfflat index created successfully');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // ivfflat requires at least 1 row to train — safe to ignore on empty table
    if (msg.includes('does not contain') || msg.includes('at least')) {
      console.log('ivfflat skipped (table empty — run after inserting data)');
    } else {
      console.error('Index error:', msg);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

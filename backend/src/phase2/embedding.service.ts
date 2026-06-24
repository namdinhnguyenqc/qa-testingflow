import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface OpenAiEmbeddingResponse {
  data: { embedding: number[] }[];
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async embedRequirementItem(itemId: string, text: string): Promise<void> {
    const vector = await this.fetchEmbedding(text);
    if (!vector) return;

    const formatted = `[${vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE aiqa_dev.requirement_items SET embedding = $1::vector WHERE id = $2`,
      formatted,
      itemId,
    );
  }

  async embedRequirementVersion(versionId: string): Promise<void> {
    const items = await this.prisma.requirementItem.findMany({
      where: { requirementVersionId: versionId },
      select: { id: true, content: true, externalId: true, module: true },
    });

    for (const item of items) {
      const text = `${item.externalId} ${item.module} ${item.content}`;
      await this.embedRequirementItem(item.id, text).catch((err) =>
        this.logger.warn(`Embedding failed for item ${item.id}: ${err.message}`),
      );
    }
    this.logger.log(`Embedded ${items.length} items for version ${versionId}`);
  }

  async semanticSearch(
    versionId: string,
    query: string,
    topK = 10,
  ): Promise<{ id: string; externalId: string; module: string; content: string; score: number }[]> {
    const vector = await this.fetchEmbedding(query);
    if (!vector) return this.fallbackSearch(versionId, query, topK);

    const formatted = `[${vector.join(',')}]`;
    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; external_id: string; module: string; content: string; score: number }[]
    >(
      `SELECT id, external_id, module, content,
              1 - (embedding <=> $1::vector) AS score
       FROM aiqa_dev.requirement_items
       WHERE requirement_version_id = $2
         AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      formatted,
      versionId,
      topK,
    );

    return rows.map((r) => ({
      id: r.id,
      externalId: r.external_id,
      module: r.module,
      content: r.content,
      score: Math.round(Number(r.score) * 10000) / 10000,
    }));
  }

  private async fallbackSearch(versionId: string, query: string, topK: number) {
    const items = await this.prisma.requirementItem.findMany({
      where: {
        requirementVersionId: versionId,
        content: { contains: query, mode: 'insensitive' },
      },
      take: topK,
      select: { id: true, externalId: true, module: true, content: true },
    });
    return items.map((i) => ({ ...i, score: 0 }));
  }

  private async fetchEmbedding(text: string): Promise<number[] | null> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) return null;

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000),
        }),
      });

      if (!response.ok) {
        this.logger.warn(`OpenAI embeddings API error: ${response.status}`);
        return null;
      }

      const data = (await response.json()) as OpenAiEmbeddingResponse;
      return data.data[0]?.embedding ?? null;
    } catch (err) {
      this.logger.warn(`Embedding fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }
}

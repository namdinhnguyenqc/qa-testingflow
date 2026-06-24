-- Create workflow_versions table (A3.3)
CREATE TABLE IF NOT EXISTS aiqa_dev.workflow_versions (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    definition JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT workflow_versions_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS workflow_versions_name_versionNo_key
    ON aiqa_dev.workflow_versions(name, "versionNo");

CREATE INDEX IF NOT EXISTS workflow_versions_name_idx
    ON aiqa_dev.workflow_versions(name);

-- ivfflat cosine index on requirement_items.embedding (A3.2)
-- Requires pgvector extension; lists=100 suits up to ~1M rows
CREATE INDEX IF NOT EXISTS idx_requirement_items_embedding
    ON aiqa_dev.requirement_items
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

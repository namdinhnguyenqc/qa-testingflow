-- Migration: Add Phase 03 UI exploration environment and worker job schema
-- Browser/MCP workers consume ui_exploration_jobs outside the web request runtime.

CREATE TABLE IF NOT EXISTS feature_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Staging',
    base_url TEXT NOT NULL,
    allowed_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_environments_feature_id ON feature_environments(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_environments_active ON feature_environments(is_active);

CREATE TABLE IF NOT EXISTS ui_exploration_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES feature_environments(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    allowed_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    progress_message TEXT,
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ui_exploration_jobs_feature_id ON ui_exploration_jobs(feature_id);
CREATE INDEX IF NOT EXISTS idx_ui_exploration_jobs_status ON ui_exploration_jobs(status);

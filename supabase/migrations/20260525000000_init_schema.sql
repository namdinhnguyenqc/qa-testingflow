-- Migration: Init schema for QAFlow AI (Phase 00)
-- Target: projects, features, input_sources tables

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create features table
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_features_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_features_project_id ON features(project_id);

-- 3. Create input_sources table
CREATE TABLE IF NOT EXISTS input_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL,
    source_type TEXT NOT NULL, -- 'requirement_text', 'requirement_file', 'figma_image', 'figma_pdf'
    title TEXT,
    original_file_name TEXT,
    storage_bucket TEXT,
    storage_path TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    text_content TEXT,
    status TEXT NOT NULL DEFAULT 'UPLOADED', -- 'UPLOADED', 'TEXT_AVAILABLE', 'REMOVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_input_sources_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_input_sources_feature_id ON input_sources(feature_id);

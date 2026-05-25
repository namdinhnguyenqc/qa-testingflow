-- Migration: Add schema for AI Runs, Artifacts, Clarifications, and Testcases (Phase 01)
-- Target: workflow_runs, step_runs, clarification_threads, clarification_messages, artifacts, test_cases, export_files tables

-- 1. Create workflow_runs table
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    workflow_key TEXT NOT NULL,
    workflow_file_path TEXT NOT NULL,
    workflow_revision TEXT,
    initiated_model_id TEXT,
    status TEXT NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_feature_id ON workflow_runs(feature_id);

-- 2. Create step_runs table
CREATE TABLE IF NOT EXISTS step_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE, -- Denormalize for convenience
    step_key TEXT NOT NULL,
    skill_file_path TEXT NOT NULL,
    skill_revision TEXT,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    input_snapshot_json JSONB NOT NULL,
    raw_output_text TEXT,
    validated_output_json JSONB,
    validation_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VALID', 'INVALID', 'REPAIRED', 'FAILED'
    repair_attempts INTEGER NOT NULL DEFAULT 0,
    error_summary TEXT,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_step_runs_workflow_run_id ON step_runs(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_step_runs_feature_id ON step_runs(feature_id);

-- 3. Create artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    step_run_id UUID REFERENCES step_runs(id) ON DELETE SET NULL,
    parent_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL, -- Version lineage
    artifact_type TEXT NOT NULL, -- 'REQUIREMENT_ANALYSIS', 'READINESS_RESULT', 'FEATURE_UNDERSTANDING', 'TESTCASE_SET', 'TESTCASE_FINAL'
    version_no INTEGER NOT NULL DEFAULT 1,
    content_json JSONB NOT NULL,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'CONFIRMED', 'FINAL', 'SUPERSEDED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_artifacts_feature_id ON artifacts(feature_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(artifact_type);

-- 4. Create clarification_threads table
CREATE TABLE IF NOT EXISTS clarification_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    source_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'READY_FOR_REVIEW', 'RESOLVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clarification_threads_feature_id ON clarification_threads(feature_id);

-- 5. Create clarification_messages table
CREATE TABLE IF NOT EXISTS clarification_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES clarification_threads(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- 'AI', 'USER'
    category TEXT, -- 'business_rule', 'validation', 'permission', 'state', 'error', 'ui_conflict'
    content TEXT NOT NULL,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    question_key TEXT,
    related_source_refs JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clarification_messages_thread_id ON clarification_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_clarification_messages_feature_id ON clarification_messages(feature_id);

-- 6. Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    test_case_code TEXT NOT NULL,
    module TEXT NOT NULL,
    scenario TEXT NOT NULL,
    case_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    preconditions_json JSONB NOT NULL,
    steps_json JSONB NOT NULL,
    test_data_json JSONB,
    expected_result TEXT NOT NULL,
    automation_candidate BOOLEAN NOT NULL DEFAULT false,
    requirement_mapping_json JSONB,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'FINAL'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_feature_id ON test_cases(feature_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_artifact_id ON test_cases(artifact_id);

-- 7. Create export_files table
CREATE TABLE IF NOT EXISTS export_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL, -- 'XLSX'
    storage_bucket TEXT,
    storage_path TEXT,
    file_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_files_feature_id ON export_files(feature_id);

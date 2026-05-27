-- Migration: Add Phase 02 skill quality and model evaluation schema
-- Target: artifact_feedback, evaluation_runs, evaluation_results

CREATE TABLE IF NOT EXISTS artifact_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    generated_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    final_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    rating TEXT NOT NULL, -- 'GOOD', 'NEEDS_REVISION', 'REJECTED'
    issue_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    comment TEXT,
    is_golden_candidate BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifact_feedback_artifact_id ON artifact_feedback(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_feedback_feature_id ON artifact_feedback(feature_id);
CREATE INDEX IF NOT EXISTS idx_artifact_feedback_rating ON artifact_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_artifact_feedback_golden ON artifact_feedback(is_golden_candidate);

CREATE TABLE IF NOT EXISTS evaluation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    step_key TEXT NOT NULL,
    skill_file_path TEXT NOT NULL,
    skill_revision TEXT,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    model_a_id TEXT NOT NULL,
    model_b_id TEXT NOT NULL,
    input_snapshot_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_evaluation_runs_feature_id ON evaluation_runs(feature_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_step_key ON evaluation_runs(step_key);

CREATE TABLE IF NOT EXISTS evaluation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_run_id UUID NOT NULL REFERENCES evaluation_runs(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL,
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    output_json JSONB NOT NULL,
    validation_status TEXT NOT NULL DEFAULT 'VALID',
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_results_run_id ON evaluation_results(evaluation_run_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_feature_id ON evaluation_results(feature_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_model_id ON evaluation_results(model_id);

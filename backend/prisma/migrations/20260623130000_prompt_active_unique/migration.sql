-- Enforce one active prompt version per prompt name.
CREATE UNIQUE INDEX "prompt_versions_one_active_per_name"
ON "aiqa_dev"."prompt_versions"("name")
WHERE "isActive" = true;

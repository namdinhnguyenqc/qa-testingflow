import { supabaseServer } from "@/lib/supabase"
import { Project, CreateProjectDTO, UpdateProjectDTO } from "@/domain/projects/types"
import { Feature, CreateFeatureDTO, UpdateFeatureDTO } from "@/domain/features/types"
import { InputSource, CreateInputSourceDTO } from "@/domain/inputs/types"
import { WorkflowRun, CreateWorkflowRunDTO, StepRun, CreateStepRunDTO } from "@/domain/workflow-runs/types"
import { Artifact, CreateArtifactDTO } from "@/domain/artifacts/types"
import { ClarificationThread, CreateThreadDTO, ClarificationMessage, CreateMessageDTO } from "@/domain/clarifications/types"
import { TestCase, CreateTestCaseDTO } from "@/domain/testcases/types"
import {
  ArtifactFeedback,
  CreateArtifactFeedbackDTO,
  CreateEvaluationResultDTO,
  CreateEvaluationRunDTO,
  EvaluationResult,
  EvaluationRun,
} from "@/domain/evaluations/types"
import {
  CreateFeatureEnvironmentDTO,
  CreateUiExplorationJobDTO,
  FeatureEnvironment,
  UiExplorationJob,
} from "@/domain/ui-exploration/types"

export class SupabaseDbAdapter {
  // === Projects CRUD ===
  
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabaseServer
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch projects: ${error.message}`)
    return data || []
  }

  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw new Error(`Failed to fetch project ${id}: ${error.message}`)
    }
    return data
  }

  async createProject(dto: CreateProjectDTO): Promise<Project> {
    const { data, error } = await supabaseServer
      .from("projects")
      .insert([
        {
          name: dto.name,
          description: dto.description,
          default_model_id: dto.default_model_id,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create project: ${error.message}`)
    return data
  }

  async updateProject(id: string, dto: UpdateProjectDTO): Promise<Project> {
    const { data, error } = await supabaseServer
      .from("projects")
      .update({
        name: dto.name,
        description: dto.description,
        default_model_id: dto.default_model_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update project ${id}: ${error.message}`)
    return data
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabaseServer
      .from("projects")
      .delete()
      .eq("id", id)

    if (error) throw new Error(`Failed to delete project ${id}: ${error.message}`)
  }

  // === Features CRUD ===

  async getFeaturesByProjectId(projectId: string): Promise<Feature[]> {
    const { data, error } = await supabaseServer
      .from("features")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch features: ${error.message}`)
    return data || []
  }

  async getFeatureById(id: string): Promise<Feature | null> {
    const { data, error } = await supabaseServer
      .from("features")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw new Error(`Failed to fetch feature ${id}: ${error.message}`)
    }
    return data
  }

  async createFeature(dto: CreateFeatureDTO): Promise<Feature> {
    const { data, error } = await supabaseServer
      .from("features")
      .insert([
        {
          project_id: dto.project_id,
          name: dto.name,
          description: dto.description,
          workflow_key: dto.workflow_key || "manual_test_design",
          selected_model_id: dto.selected_model_id,
          status: "DRAFT",
          current_step_key: "inputs",
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create feature: ${error.message}`)
    return data
  }

  async updateFeature(id: string, dto: UpdateFeatureDTO): Promise<Feature> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.selected_model_id !== undefined) updateData.selected_model_id = dto.selected_model_id
    if (dto.status !== undefined) updateData.status = dto.status
    if (dto.current_step_key !== undefined) updateData.current_step_key = dto.current_step_key

    const { data, error } = await supabaseServer
      .from("features")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update feature ${id}: ${error.message}`)
    return data
  }

  async deleteFeature(id: string): Promise<void> {
    const { error } = await supabaseServer
      .from("features")
      .delete()
      .eq("id", id)

    if (error) throw new Error(`Failed to delete feature ${id}: ${error.message}`)
  }

  // === Input Sources CRUD ===

  async getInputSourcesByFeatureId(featureId: string): Promise<InputSource[]> {
    const { data, error } = await supabaseServer
      .from("input_sources")
      .select("*")
      .eq("feature_id", featureId)
      .order("created_at", { ascending: true })

    if (error) throw new Error(`Failed to fetch input sources: ${error.message}`)
    return data || []
  }

  async createInputSource(dto: CreateInputSourceDTO): Promise<InputSource> {
    const { data, error } = await supabaseServer
      .from("input_sources")
      .insert([
        {
          feature_id: dto.feature_id,
          source_type: dto.source_type,
          title: dto.title,
          original_file_name: dto.original_file_name,
          storage_bucket: dto.storage_bucket,
          storage_path: dto.storage_path,
          mime_type: dto.mime_type,
          size_bytes: dto.size_bytes,
          text_content: dto.text_content,
          processing_status: dto.processing_status || "UPLOADED",
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create input source: ${error.message}`)
    return data
  }

  async updateInputSourceStatus(id: string, status: InputSource["processing_status"]): Promise<InputSource> {
    const { data, error } = await supabaseServer
      .from("input_sources")
      .update({ processing_status: status })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update input source status ${id}: ${error.message}`)
    return data
  }

  // === Workflow Runs CRUD ===

  async getLatestWorkflowRunByFeatureId(featureId: string): Promise<WorkflowRun | null> {
    const { data, error } = await supabaseServer
      .from("workflow_runs")
      .select("*")
      .eq("feature_id", featureId)
      .order("started_at", { ascending: false })
      .limit(1)

    if (error) throw new Error(`Failed to fetch latest run: ${error.message}`)
    return data && data.length > 0 ? data[0] : null
  }

  async createWorkflowRun(dto: CreateWorkflowRunDTO): Promise<WorkflowRun> {
    const { data, error } = await supabaseServer
      .from("workflow_runs")
      .insert([
        {
          feature_id: dto.feature_id,
          workflow_key: dto.workflow_key,
          workflow_file_path: dto.workflow_file_path,
          workflow_revision: dto.workflow_revision,
          initiated_model_id: dto.initiated_model_id,
          status: "RUNNING",
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create workflow run: ${error.message}`)
    return data
  }

  async updateWorkflowRunStatus(id: string, status: WorkflowRun["status"]): Promise<WorkflowRun> {
    const { data, error } = await supabaseServer
      .from("workflow_runs")
      .update({
        status,
        completed_at: status !== "RUNNING" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update run status ${id}: ${error.message}`)
    return data
  }

  // === Step Runs CRUD ===

  async createStepRun(dto: CreateStepRunDTO): Promise<StepRun> {
    const { data, error } = await supabaseServer
      .from("step_runs")
      .insert([
        {
          workflow_run_id: dto.workflow_run_id,
          feature_id: dto.feature_id,
          step_key: dto.step_key,
          skill_file_path: dto.skill_file_path,
          skill_revision: dto.skill_revision,
          schema_key: dto.schema_key,
          schema_version: dto.schema_version,
          provider_id: dto.provider_id,
          model_id: dto.model_id,
          input_snapshot_json: dto.input_snapshot_json,
          status: "QUEUED",
          validation_status: "PENDING",
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create step run: ${error.message}`)
    return data
  }

  async updateStepRun(
    id: string,
    updates: Partial<Omit<StepRun, "id" | "created_at">>
  ): Promise<StepRun> {
    const { data, error } = await supabaseServer
      .from("step_runs")
      .update({
        ...updates,
        completed_at: updates.status && updates.status !== "RUNNING" && updates.status !== "QUEUED" 
          ? new Date().toISOString() 
          : undefined,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update step run ${id}: ${error.message}`)
    return data
  }

  async getStepRunsByFeatureId(featureId: string): Promise<StepRun[]> {
    const { data, error } = await supabaseServer
      .from("step_runs")
      .select("*")
      .eq("feature_id", featureId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch step runs: ${error.message}`)
    return data || []
  }

  // === Artifacts CRUD ===

  async getArtifactsByFeatureId(featureId: string): Promise<Artifact[]> {
    const { data, error } = await supabaseServer
      .from("artifacts")
      .select("*")
      .eq("feature_id", featureId)
      .order("version_no", { ascending: false })

    if (error) throw new Error(`Failed to fetch artifacts: ${error.message}`)
    return data || []
  }

  async getLatestArtifactByType(featureId: string, type: Artifact["artifact_type"]): Promise<Artifact | null> {
    const { data, error } = await supabaseServer
      .from("artifacts")
      .select("*")
      .eq("feature_id", featureId)
      .eq("artifact_type", type)
      .order("version_no", { ascending: false })
      .limit(1)

    if (error) throw new Error(`Failed to fetch latest artifact: ${error.message}`)
    return data && data.length > 0 ? data[0] : null
  }

  async createArtifact(dto: CreateArtifactDTO): Promise<Artifact> {
    // 1. Tìm version_no cao nhất của loại artifact này trong feature
    const latest = await this.getLatestArtifactByType(dto.feature_id, dto.artifact_type)
    const nextVersionNo = latest ? latest.version_no + 1 : 1

    // 2. Nếu có artifact cũ, đánh dấu nó bị SUPERSEDED (nếu status = DRAFT/CONFIRMED)
    if (latest && latest.status !== "SUPERSEDED") {
      await supabaseServer
        .from("artifacts")
        .update({ status: "SUPERSEDED" })
        .eq("id", latest.id)
    }

    // 3. Insert new artifact
    const { data, error } = await supabaseServer
      .from("artifacts")
      .insert([
        {
          feature_id: dto.feature_id,
          step_run_id: dto.step_run_id,
          parent_artifact_id: dto.parent_artifact_id || (latest ? latest.id : null),
          artifact_type: dto.artifact_type,
          version_no: dto.version_no || nextVersionNo,
          content_json: dto.content_json,
          schema_key: dto.schema_key,
          schema_version: dto.schema_version,
          status: dto.status || "DRAFT",
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create artifact: ${error.message}`)
    return data
  }

  async confirmArtifact(id: string): Promise<Artifact> {
    const { data, error } = await supabaseServer
      .from("artifacts")
      .update({
        status: "CONFIRMED",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to confirm artifact ${id}: ${error.message}`)
    return data
  }

  // === Clarification Threads & Messages CRUD ===

  async getOrCreateClarificationThread(featureId: string, sourceArtifactId?: string): Promise<ClarificationThread> {
    const { data: existing, error: fetchError } = await supabaseServer
      .from("clarification_threads")
      .select("*")
      .eq("feature_id", featureId)
      .limit(1)

    if (fetchError) throw new Error(`Failed to fetch thread: ${fetchError.message}`)
    if (existing && existing.length > 0) return existing[0]

    const { data: created, error: createError } = await supabaseServer
      .from("clarification_threads")
      .insert([
        {
          feature_id: featureId,
          source_artifact_id: sourceArtifactId,
          status: "OPEN",
        },
      ])
      .select()
      .single()

    if (createError) throw new Error(`Failed to create thread: ${createError.message}`)
    return created
  }

  async getClarificationMessagesByThreadId(threadId: string): Promise<ClarificationMessage[]> {
    const { data, error } = await supabaseServer
      .from("clarification_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })

    if (error) throw new Error(`Failed to fetch messages: ${error.message}`)
    return data || []
  }

  async createClarificationMessage(dto: CreateMessageDTO): Promise<ClarificationMessage> {
    const { data, error } = await supabaseServer
      .from("clarification_messages")
      .insert([
        {
          thread_id: dto.thread_id,
          feature_id: dto.feature_id,
          sender_type: dto.sender_type,
          category: dto.category,
          content: dto.content,
          is_critical: dto.is_critical || false,
          question_key: dto.question_key,
          related_source_refs: dto.related_source_refs,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create message: ${error.message}`)
    return data
  }

  async updateThreadStatus(id: string, status: ClarificationThread["status"]): Promise<ClarificationThread> {
    const { data, error } = await supabaseServer
      .from("clarification_threads")
      .update({ status })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update thread status ${id}: ${error.message}`)
    return data
  }

  // === Test Cases CRUD ===

  async getTestCasesByArtifactId(artifactId: string): Promise<TestCase[]> {
    const { data, error } = await supabaseServer
      .from("test_cases")
      .select("*")
      .eq("artifact_id", artifactId)
      .order("test_case_code", { ascending: true })

    if (error) throw new Error(`Failed to fetch test cases: ${error.message}`)
    return data || []
  }

  async saveTestCases(cases: CreateTestCaseDTO[]): Promise<TestCase[]> {
    if (cases.length === 0) return []

    const { data, error } = await supabaseServer
      .from("test_cases")
      .insert(
        cases.map((c) => ({
          feature_id: c.feature_id,
          artifact_id: c.artifact_id,
          test_case_code: c.test_case_code,
          module: c.module,
          scenario: c.scenario,
          case_type: c.case_type,
          priority: c.priority,
          preconditions_json: c.preconditions_json,
          steps_json: c.steps_json,
          test_data_json: c.test_data_json,
          expected_result: c.expected_result,
          automation_candidate: c.automation_candidate || false,
          requirement_mapping_json: c.requirement_mapping_json,
          status: c.status || "DRAFT",
        }))
      )
      .select()

    if (error) throw new Error(`Failed to bulk insert test cases: ${error.message}`)
    return data || []
  }

  async updateTestCase(id: string, updates: Partial<Omit<TestCase, "id" | "created_at">>): Promise<TestCase> {
    const { data, error } = await supabaseServer
      .from("test_cases")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update test case ${id}: ${error.message}`)
    return data
  }

  async deleteTestCase(id: string): Promise<void> {
    const { error } = await supabaseServer
      .from("test_cases")
      .delete()
      .eq("id", id)

    if (error) throw new Error(`Failed to delete test case ${id}: ${error.message}`)
  }

  // === Phase 02 Evaluation & Feedback CRUD ===

  async createArtifactFeedback(dto: CreateArtifactFeedbackDTO): Promise<ArtifactFeedback> {
    const { data, error } = await supabaseServer
      .from("artifact_feedback")
      .insert([
        {
          artifact_id: dto.artifact_id,
          feature_id: dto.feature_id,
          generated_artifact_id: dto.generated_artifact_id,
          final_artifact_id: dto.final_artifact_id,
          rating: dto.rating,
          issue_categories: dto.issue_categories || [],
          comment: dto.comment,
          is_golden_candidate: dto.is_golden_candidate || false,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create artifact feedback: ${error.message}`)
    return data
  }

  async getArtifactFeedbackByArtifactId(artifactId: string): Promise<ArtifactFeedback[]> {
    const { data, error } = await supabaseServer
      .from("artifact_feedback")
      .select("*")
      .eq("artifact_id", artifactId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch artifact feedback: ${error.message}`)
    return data || []
  }

  async getArtifactFeedbackByFeatureId(featureId: string): Promise<ArtifactFeedback[]> {
    const { data, error } = await supabaseServer
      .from("artifact_feedback")
      .select("*")
      .eq("feature_id", featureId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch feature feedback: ${error.message}`)
    return data || []
  }

  async createEvaluationRun(dto: CreateEvaluationRunDTO): Promise<EvaluationRun> {
    const { data, error } = await supabaseServer
      .from("evaluation_runs")
      .insert([
        {
          feature_id: dto.feature_id,
          step_key: dto.step_key,
          skill_file_path: dto.skill_file_path,
          skill_revision: dto.skill_revision,
          schema_key: dto.schema_key,
          schema_version: dto.schema_version,
          model_a_id: dto.model_a_id,
          model_b_id: dto.model_b_id,
          input_snapshot_json: dto.input_snapshot_json,
          status: dto.status || "COMPLETED",
          completed_at: dto.status === "QUEUED" || dto.status === "RUNNING" ? null : new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create evaluation run: ${error.message}`)
    return data
  }

  async createEvaluationResult(dto: CreateEvaluationResultDTO): Promise<EvaluationResult> {
    const { data, error } = await supabaseServer
      .from("evaluation_results")
      .insert([
        {
          evaluation_run_id: dto.evaluation_run_id,
          feature_id: dto.feature_id,
          model_id: dto.model_id,
          artifact_id: dto.artifact_id,
          output_json: dto.output_json,
          validation_status: dto.validation_status || "VALID",
          error_summary: dto.error_summary,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create evaluation result: ${error.message}`)
    return data
  }

  async getEvaluationRunsByFeatureId(featureId: string): Promise<EvaluationRun[]> {
    const { data, error } = await supabaseServer
      .from("evaluation_runs")
      .select("*")
      .eq("feature_id", featureId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch evaluation runs: ${error.message}`)
    return data || []
  }

  async getEvaluationResultsByFeatureId(featureId: string): Promise<EvaluationResult[]> {
    const { data, error } = await supabaseServer
      .from("evaluation_results")
      .select("*")
      .eq("feature_id", featureId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch evaluation results: ${error.message}`)
    return data || []
  }

  // === Phase 03 UI Exploration CRUD ===

  async createFeatureEnvironment(dto: CreateFeatureEnvironmentDTO): Promise<FeatureEnvironment> {
    const { data, error } = await supabaseServer
      .from("feature_environments")
      .insert([
        {
          feature_id: dto.feature_id,
          name: dto.name || "Staging",
          base_url: dto.base_url,
          allowed_domains: dto.allowed_domains,
          is_active: dto.is_active ?? true,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create feature environment: ${error.message}`)
    return data
  }

  async getFeatureEnvironments(featureId: string): Promise<FeatureEnvironment[]> {
    const { data, error } = await supabaseServer
      .from("feature_environments")
      .select("*")
      .eq("feature_id", featureId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch feature environments: ${error.message}`)
    return data || []
  }

  async getFeatureEnvironmentById(id: string): Promise<FeatureEnvironment | null> {
    const { data, error } = await supabaseServer
      .from("feature_environments")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Failed to fetch feature environment ${id}: ${error.message}`)
    }
    return data
  }

  async createUiExplorationJob(dto: CreateUiExplorationJobDTO): Promise<UiExplorationJob> {
    const { data, error } = await supabaseServer
      .from("ui_exploration_jobs")
      .insert([
        {
          feature_id: dto.feature_id,
          environment_id: dto.environment_id,
          target_url: dto.target_url,
          allowed_domains: dto.allowed_domains,
          status: dto.status || "QUEUED",
          progress_message: dto.progress_message || "Queued for external Playwright MCP worker.",
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create UI exploration job: ${error.message}`)
    return data
  }

  async getUiExplorationJobs(featureId: string): Promise<UiExplorationJob[]> {
    const { data, error } = await supabaseServer
      .from("ui_exploration_jobs")
      .select("*")
      .eq("feature_id", featureId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch UI exploration jobs: ${error.message}`)
    return data || []
  }
}

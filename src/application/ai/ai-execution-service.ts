import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import { SkillLoader } from "@/infrastructure/skills/skill-loader"
import { OpenAICompatibleAdapter } from "@/infrastructure/model/openai-adapter"
import { ModelExecutionResult } from "@/infrastructure/model/model-adapter"
import { JsonValidator } from "@/infrastructure/validation/json-validator"
import { StepRun, ValidationStatus } from "@/domain/workflow-runs/types"
import { Artifact } from "@/domain/artifacts/types"

export type ModelExecutionMode = ModelExecutionResult["executionMode"]

export interface AiStepExecutionResult {
  stepRun: StepRun
  artifact?: Artifact
  error?: string
  executionMode?: ModelExecutionMode
}

export class AiExecutionService {
  private dbAdapter: SupabaseDbAdapter
  private skillLoader: SkillLoader
  private modelAdapter: OpenAICompatibleAdapter
  private jsonValidator: JsonValidator

  private maxRepairAttempts = 2

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
    this.skillLoader = new SkillLoader()
    this.modelAdapter = new OpenAICompatibleAdapter()
    this.jsonValidator = new JsonValidator()
  }

  /**
   * Pipeline thực thi một AI Workflow Step
   */
  async executeStep(params: {
    featureId: string
    workflowRunId: string
    stepKey: string
    skillPath: string
    schemaKey: string
    schemaVersion: string
    modelId: string
    contextData: string
  }): Promise<AiStepExecutionResult> {
    // 1. Khởi tạo step run
    const stepRun = await this.dbAdapter.createStepRun({
      workflow_run_id: params.workflowRunId,
      feature_id: params.featureId,
      step_key: params.stepKey,
      skill_file_path: params.skillPath,
      schema_key: params.schemaKey,
      schema_version: params.schemaVersion,
      provider_id: this.modelAdapter.providerId,
      model_id: params.modelId,
      input_snapshot_json: { context: params.contextData },
    })

    // 2. Load skill and schema
    let skillContent = ""
    let schemaJson: Record<string, any> = {}
    try {
      skillContent = await this.skillLoader.loadSkill(params.skillPath)
      schemaJson = await this.skillLoader.loadSchema(params.schemaKey)
    } catch (err: any) {
      const failedStep = await this.dbAdapter.updateStepRun(stepRun.id, {
        status: "FAILED",
        error_summary: `Failed to load skill/schema assets: ${err.message}`,
      })
      return { stepRun: failedStep, error: err.message }
    }

    // Cập nhật trạng thái sang RUNNING
    await this.dbAdapter.updateStepRun(stepRun.id, { status: "RUNNING" })

    // 3. Gọi Model Adapter lần 1
    const systemInstructions = `Bạn là một Senior QA chuyên nghiệp làm việc trong hệ thống QAFlow AI. Nhiệm vụ của bạn là thực hiện phân tích nghiệp vụ dựa trên yêu cầu của skill.`
    
    let modelResult = await this.modelAdapter.executeStructuredTask({
      modelId: params.modelId,
      systemInstructions,
      skillInstructions: skillContent,
      context: params.contextData,
      outputSchema: schemaJson,
    })

    if (modelResult.error) {
      const failedStep = await this.dbAdapter.updateStepRun(stepRun.id, {
        status: "FAILED",
        error_summary: `AI Provider Error: ${modelResult.error}`,
      })
      return { stepRun: failedStep, error: modelResult.error, executionMode: modelResult.executionMode }
    }

    // 4. Validate và Repair Loop
    let parsedData = modelResult.parsedOutput
    let validation = this.jsonValidator.validateSchema(schemaJson, parsedData)
    let repairAttempts = 0
    let currentRaw = modelResult.rawOutput
    let executionMode = modelResult.executionMode
    let validationStatus: ValidationStatus = validation.isValid ? "VALID" : "INVALID"

    while (!validation.isValid && repairAttempts < this.maxRepairAttempts) {
      repairAttempts++
      console.log(`⚠️ Step ${params.stepKey} JSON invalid. Activating repair attempt #${repairAttempts}...`)

      const repairPrompt = `
Dữ liệu JSON trước của bạn trả về không khớp với JSON Schema yêu cầu.
Lỗi do validator phát hiện:
${validation.errors?.join("\n")}

Dữ liệu JSON bị lỗi gốc:
${JSON.stringify(parsedData, null, 2)}

Hãy phân tích lỗi trên, sửa lại cấu trúc và trả về một khối JSON hoàn toàn hợp lệ khớp chuẩn xác với JSON Schema.
`

      modelResult = await this.modelAdapter.executeStructuredTask({
        modelId: params.modelId,
        systemInstructions,
        skillInstructions: `${skillContent}\n\nREPAIR INSTRUCTIONS:\n${repairPrompt}`,
        context: params.contextData,
        outputSchema: schemaJson,
      })

      if (modelResult.error) {
        currentRaw = modelResult.rawOutput
        executionMode = modelResult.executionMode
        break
      }

      parsedData = modelResult.parsedOutput
      validation = this.jsonValidator.validateSchema(schemaJson, parsedData)
      currentRaw = modelResult.rawOutput
      executionMode = modelResult.executionMode
      validationStatus = validation.isValid ? "REPAIRED" : "INVALID"
    }

    // 5. Lưu kết quả thực thi
    if (modelResult.error) {
      const failedStep = await this.dbAdapter.updateStepRun(stepRun.id, {
        status: "FAILED",
        repair_attempts: repairAttempts,
        raw_output_text: currentRaw,
        error_summary: `AI Provider Error: ${modelResult.error}`,
      })
      return { stepRun: failedStep, error: modelResult.error, executionMode }
    }

    if (!validation.isValid) {
      const failedStep = await this.dbAdapter.updateStepRun(stepRun.id, {
        status: "FAILED",
        validation_status: "FAILED",
        repair_attempts: repairAttempts,
        raw_output_text: currentRaw,
        error_summary: `JSON validation failed after ${repairAttempts} repair attempts. Errors:\n${validation.errors?.join("\n")}`,
      })
      return {
        stepRun: failedStep,
        error: `JSON Schema validation failed: ${validation.errors?.[0]}`,
        executionMode,
      }
    }

    // Đã VALID hoặc REPAIRED thành công
    const persistedOutput = {
      ...(parsedData || {}),
      _modelExecution: { executionMode },
    }

    const completedStep = await this.dbAdapter.updateStepRun(stepRun.id, {
      status: "COMPLETED",
      validation_status: validationStatus,
      repair_attempts: repairAttempts,
      raw_output_text: currentRaw,
      validated_output_json: persistedOutput,
    })

    // 6. Tạo Artifact mới
    // Map stepKey sang ArtifactType
    let artifactType: Artifact["artifact_type"] = "REQUIREMENT_ANALYSIS"
    if (params.stepKey === "clarification") {
      artifactType = "READINESS_RESULT"
    } else if (params.stepKey === "feature_understanding") {
      artifactType = "FEATURE_UNDERSTANDING"
    } else if (params.stepKey === "testcase_generation") {
      artifactType = "TESTCASE_SET"
    }

    const artifact = await this.dbAdapter.createArtifact({
      feature_id: params.featureId,
      step_run_id: completedStep.id,
      artifact_type: artifactType,
      content_json: persistedOutput,
      schema_key: params.schemaKey,
      schema_version: params.schemaVersion,
      status: "DRAFT", // artifact ban đầu luôn ở dạng DRAFT
    })

    return {
      stepRun: completedStep,
      artifact,
      executionMode,
    }
  }
}

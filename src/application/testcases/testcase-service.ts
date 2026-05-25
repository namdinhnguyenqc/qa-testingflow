import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import { AiExecutionService } from "../ai/ai-execution-service"
import { TestCase, CreateTestCaseDTO } from "@/domain/testcases/types"
import { Artifact } from "@/domain/artifacts/types"
import { validateEditableTestCases } from "@/domain/testcases/validation"

export class TestCaseService {
  private dbAdapter: SupabaseDbAdapter
  private aiExecutionService: AiExecutionService

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
    this.aiExecutionService = new AiExecutionService()
  }

  /**
   * Lấy danh sách test cases thuộc một artifact cụ thể
   */
  async getTestCases(artifactId: string): Promise<TestCase[]> {
    return this.dbAdapter.getTestCasesByArtifactId(artifactId)
  }

  private async assertOfficialTestcaseGate(featureId: string): Promise<Artifact> {
    const understandingArtifact = await this.dbAdapter.getLatestArtifactByType(featureId, "FEATURE_UNDERSTANDING")
    if (!understandingArtifact || understandingArtifact.status !== "CONFIRMED") {
      throw new Error("Feature Understanding must be confirmed before generating official test cases.")
    }

    const thread = await this.dbAdapter.getOrCreateClarificationThread(featureId)
    const messages = await this.dbAdapter.getClarificationMessagesByThreadId(thread.id)
    const criticalQuestionKeys = new Set(
      messages
        .filter((message) => message.sender_type === "AI" && message.is_critical && message.question_key)
        .map((message) => message.question_key!)
    )

    if (criticalQuestionKeys.size > 0) {
      const answeredQuestionKeys = new Set(
        messages
          .filter((message) => message.sender_type === "USER" && message.question_key)
          .map((message) => message.question_key!)
      )
      const hasUnansweredCritical = Array.from(criticalQuestionKeys).some((key) => !answeredQuestionKeys.has(key))

      if (hasUnansweredCritical || thread.status !== "RESOLVED") {
        throw new Error("Critical clarification must be answered and resolved before official/final test cases.")
      }
    }

    return understandingArtifact
  }

  /**
   * AI tự động sinh kịch bản kiểm thử (Test Case Generation Step)
   */
  async generateTestCases(params: {
    projectId: string
    featureId: string
    modelId: string
    isDraftWithAssumptions?: boolean
  }): Promise<{ artifact: Artifact; testCases: TestCase[] }> {
    const { projectId, featureId, modelId, isDraftWithAssumptions = false } = params

    // 1. Kiểm tra Gate: Nếu không phải draft-only, bắt buộc phải có Confirmed Understanding
    let understandingArtifact: Artifact | null = null
    
    if (!isDraftWithAssumptions) {
      understandingArtifact = await this.assertOfficialTestcaseGate(featureId)
    } else {
      understandingArtifact = await this.dbAdapter.getLatestArtifactByType(featureId, "FEATURE_UNDERSTANDING")
    }

    // 2. Gom context: Feature Understanding content
    const contextData = `
=== FEATURE UNDERSTANDING SOURCE OF TRUTH ===
${JSON.stringify(understandingArtifact?.content_json || { note: "Draft test cases from raw inputs." }, null, 2)}
`

    const workflowRun = await this.dbAdapter.getLatestWorkflowRunByFeatureId(featureId)
    if (!workflowRun) throw new Error("No active workflow run found")

    // Cập nhật trạng thái feature sang TESTCASE_GENERATING
    await this.dbAdapter.updateFeature(featureId, { status: "TESTCASE_GENERATING" })

    // 3. Thực thi AI Step
    const execution = await this.aiExecutionService.executeStep({
      featureId,
      workflowRunId: workflowRun.id,
      stepKey: "testcase_generation",
      skillPath: "manual/testcase-generator.skill.md",
      schemaKey: "manual_testcase",
      schemaVersion: "0.1.0",
      modelId,
      contextData,
    })

    if (execution.error) {
      await this.dbAdapter.updateFeature(featureId, { status: "FAILED" })
      throw new Error(`Test case generation failed: ${execution.error}`)
    }

    const artifact = execution.artifact
    if (!artifact) throw new Error("Failed to create testcase artifact")

    // 4. Bóc tách và lưu từng dòng testcase vào bảng test_cases để tester edit inline
    const testCasesListJson = artifact.content_json.test_cases || []
    
    const dtoList: CreateTestCaseDTO[] = testCasesListJson.map((tc: any) => ({
      feature_id: featureId,
      artifact_id: artifact.id,
      test_case_code: tc.test_case_code,
      module: tc.module || "General",
      scenario: tc.scenario,
      case_type: tc.case_type,
      priority: tc.priority,
      preconditions_json: tc.preconditions,
      steps_json: tc.steps,
      test_data_json: tc.test_data,
      expected_result: tc.expected_result,
      automation_candidate: tc.automation_candidate,
      requirement_mapping_json: tc.requirement_mapping,
      status: "DRAFT",
    }))

    const savedTestCases = await this.dbAdapter.saveTestCases(dtoList)

    // Cập nhật trạng thái Feature thành TESTCASE_DRAFTED
    await this.dbAdapter.updateFeature(featureId, {
      status: "TESTCASE_DRAFTED",
      current_step_key: "testcase_review",
    })

    return {
      artifact,
      testCases: savedTestCases,
    }
  }

  /**
   * Cập nhật chỉnh sửa inline của tester cho một testcase cụ thể
   */
  async updateTestCase(id: string, updates: Partial<Omit<TestCase, "id" | "created_at">>): Promise<TestCase> {
    if (typeof updates.test_case_code === "string" && updates.test_case_code.trim().length === 0) {
      throw new Error("Test Case ID cannot be empty.")
    }
    if (typeof updates.module === "string" && updates.module.trim().length === 0) {
      throw new Error("Module cannot be empty.")
    }
    if (typeof updates.scenario === "string" && updates.scenario.trim().length === 0) {
      throw new Error("Scenario cannot be empty.")
    }
    if (typeof updates.expected_result === "string" && updates.expected_result.trim().length === 0) {
      throw new Error("Expected Result cannot be empty.")
    }
    return this.dbAdapter.updateTestCase(id, updates)
  }

  /**
   * Tạo dòng kịch bản thủ công mới (Add row)
   */
  async createManualTestCase(dto: CreateTestCaseDTO): Promise<TestCase> {
    validateEditableTestCases([
      {
        test_case_code: dto.test_case_code,
        module: dto.module,
        scenario: dto.scenario,
        expected_result: dto.expected_result,
        steps_json: dto.steps_json,
      },
    ])
    const list = await this.dbAdapter.saveTestCases([dto])
    return list[0]
  }

  /**
   * Xoá kịch bản kiểm thử (Delete row)
   */
  async deleteTestCase(id: string): Promise<void> {
    return this.dbAdapter.deleteTestCase(id)
  }

  /**
   * Tester chính thức hoàn tất chỉnh sửa, lưu phiên bản Final
   */
  async saveFinalVersion(featureId: string, sourceArtifactId: string): Promise<Artifact> {
    // 1. Lấy toàn bộ các dòng testcases hiện tại của source artifact (chứa các bản chỉnh sửa inline của tester)
    await this.assertOfficialTestcaseGate(featureId)

    const currentCases = await this.dbAdapter.getTestCasesByArtifactId(sourceArtifactId)
    validateEditableTestCases(currentCases)

    // 2. Map thành content_json của artifact mới
    const contentJson = {
      test_cases: currentCases.map((tc) => ({
        test_case_code: tc.test_case_code,
        module: tc.module,
        scenario: tc.scenario,
        case_type: tc.case_type,
        priority: tc.priority,
        preconditions: tc.preconditions_json,
        steps: tc.steps_json,
        test_data: tc.test_data_json,
        expected_result: tc.expected_result,
        automation_candidate: tc.automation_candidate,
        requirement_mapping: tc.requirement_mapping_json,
      })),
    }

    // 3. Tạo artifact mới kiểu TESTCASE_FINAL có status = FINAL
    const finalArtifact = await this.dbAdapter.createArtifact({
      feature_id: featureId,
      parent_artifact_id: sourceArtifactId,
      artifact_type: "TESTCASE_FINAL",
      content_json: contentJson,
      schema_key: "manual_testcase",
      schema_version: "0.1.0",
      status: "FINAL",
    })

    // 4. Lưu clone các dòng test case tương ứng gắn với finalArtifact.id mới
    const dtoList: CreateTestCaseDTO[] = currentCases.map((tc) => ({
      feature_id: featureId,
      artifact_id: finalArtifact.id,
      test_case_code: tc.test_case_code,
      module: tc.module,
      scenario: tc.scenario,
      case_type: tc.case_type,
      priority: tc.priority,
      preconditions_json: tc.preconditions_json,
      steps_json: tc.steps_json,
      test_data_json: tc.test_data_json,
      expected_result: tc.expected_result,
      automation_candidate: tc.automation_candidate,
      requirement_mapping_json: tc.requirement_mapping_json,
      status: "FINAL",
    }))

    await this.dbAdapter.saveTestCases(dtoList)

    // 5. Cập nhật Feature thành COMPLETED
    await this.dbAdapter.updateFeature(featureId, {
      status: "COMPLETED",
      current_step_key: "export",
    })

    return finalArtifact
  }
}

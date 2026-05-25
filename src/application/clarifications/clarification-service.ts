import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import { AiExecutionService } from "../ai/ai-execution-service"
import { ClarificationMessage, ClarificationThread } from "@/domain/clarifications/types"

export class ClarificationService {
  private dbAdapter: SupabaseDbAdapter
  private aiExecutionService: AiExecutionService

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
    this.aiExecutionService = new AiExecutionService()
  }

  /**
   * Lấy thread câu hỏi làm rõ và toàn bộ các tin nhắn (Q&A history)
   */
  async getThreadWithMessages(featureId: string): Promise<{
    thread: ClarificationThread | null
    messages: ClarificationMessage[]
  }> {
    const thread = await this.dbAdapter.getOrCreateClarificationThread(featureId)
    const messages = await this.dbAdapter.getClarificationMessagesByThreadId(thread.id)
    return { thread, messages }
  }

  /**
   * Thực hiện chạy phân tích Requirement (Requirement Analysis Step)
   */
  async runRequirementAnalysis(projectId: string, featureId: string, modelId: string): Promise<any> {
    // 1. Khởi chạy hoặc lấy Workflow Run
    let workflowRun = await this.dbAdapter.getLatestWorkflowRunByFeatureId(featureId)
    if (!workflowRun || workflowRun.status !== "RUNNING") {
      workflowRun = await this.dbAdapter.createWorkflowRun({
        feature_id: featureId,
        workflow_key: "manual_test_design",
        workflow_file_path: "qa-core/workflows/manual-test-design.workflow.md",
        initiated_model_id: modelId,
      })
    }

    // 2. Gom toàn bộ active input sources làm context
    const sources = await this.dbAdapter.getInputSourcesByFeatureId(featureId)
    const activeSources = sources.filter((s) => s.status !== "REMOVED")
    
    let contextStr = "DANH SÁCH TÀI LIỆU ĐẦU VÀO:\n"
    activeSources.forEach((source, index) => {
      contextStr += `\n[TÀI LIỆU ${index + 1}] Title: ${source.title}, Type: ${source.source_type}\n`
      if (source.text_content) {
        contextStr += `Nội dung mô tả:\n${source.text_content}\n`
      }
    })

    // Cập nhật trạng thái feature sang ANALYZING
    await this.dbAdapter.updateFeature(featureId, { status: "ANALYZING" })

    // 3. Thực thi AI Step
    const execution = await this.aiExecutionService.executeStep({
      featureId,
      workflowRunId: workflowRun.id,
      stepKey: "requirement_analysis",
      skillPath: "common/requirement-reader.skill.md",
      schemaKey: "requirement_analysis",
      schemaVersion: "0.1.0",
      modelId,
      contextData: contextStr,
    })

    if (execution.error) {
      await this.dbAdapter.updateFeature(featureId, { status: "FAILED" })
      await this.dbAdapter.updateWorkflowRunStatus(workflowRun.id, "FAILED")
      throw new Error(`Requirement analysis failed: ${execution.error}`)
    }

    // Phân tích kết quả để quyết định chuyển trạng thái Feature
    const analysisJson = execution.artifact?.content_json || {}
    const missingCritical = analysisJson.missing_critical || []

    let nextStatus: any = "READY_FOR_UNDERSTANDING"

    // 4. Nếu có critical missing rules -> chuyển sang Needs Clarification
    if (missingCritical.length > 0) {
      nextStatus = "NEEDS_CLARIFICATION"
      
      // Tạo thread và đổ câu hỏi vào clarification_messages
      const thread = await this.dbAdapter.getOrCreateClarificationThread(featureId, execution.artifact?.id)
      
      for (const q of missingCritical) {
        await this.dbAdapter.createClarificationMessage({
          thread_id: thread.id,
          feature_id: featureId,
          sender_type: "AI",
          category: "business_rule",
          content: q.description,
          is_critical: true,
          question_key: q.rule_key,
        })
      }
    }

    await this.dbAdapter.updateFeature(featureId, {
      status: nextStatus,
    })

    return execution.artifact
  }

  /**
   * Lưu câu trả lời làm rõ của tester
   */
  async submitUserAnswers(
    featureId: string,
    answers: { questionKey: string; content: string }[]
  ): Promise<ClarificationMessage[]> {
    const thread = await this.dbAdapter.getOrCreateClarificationThread(featureId)
    const savedMessages: ClarificationMessage[] = []

    for (const ans of answers) {
      if (ans.content.trim().length === 0) continue

      const msg = await this.dbAdapter.createClarificationMessage({
        thread_id: thread.id,
        feature_id: featureId,
        sender_type: "USER",
        content: ans.content.trim(),
        question_key: ans.questionKey,
        is_critical: false, // User answer không phải question critical
      })
      savedMessages.push(msg)
    }

    // Đánh dấu thread đang ở chế độ READY_FOR_REVIEW để chuẩn bị re-evaluate
    await this.dbAdapter.updateThreadStatus(thread.id, "READY_FOR_REVIEW")

    return savedMessages
  }

  /**
   * AI Re-evaluate Readiness & Sinh Feature Understanding nếu pass
   */
  async runReadinessAndUnderstanding(projectId: string, featureId: string, modelId: string): Promise<any> {
    const workflowRun = await this.dbAdapter.getLatestWorkflowRunByFeatureId(featureId)
    if (!workflowRun) throw new Error("No active workflow run found")

    // 1. Gom context: Inputs + Q&A History
    const sources = await this.dbAdapter.getInputSourcesByFeatureId(featureId)
    const activeSources = sources.filter((s) => s.status !== "REMOVED")
    
    let contextStr = "=== INPUT DOCUMENTS ===\n"
    activeSources.forEach((source, idx) => {
      contextStr += `[Doc ${idx + 1}] Title: ${source.title}\n${source.text_content || ""}\n`
    })

    const { thread, messages } = await this.getThreadWithMessages(featureId)
    if (messages.length > 0) {
      contextStr += "\n=== Q&A CLARIFICATION HISTORY ===\n"
      messages.forEach((msg) => {
        contextStr += `[${msg.sender_type === "AI" ? "QUESTION Key: " + msg.question_key : "ANSWER"}] ${msg.content}\n`
      })
    }

    // 2. Chạy bước sinh Feature Understanding
    // Cập nhật trạng thái feature sang ANALYZING
    await this.dbAdapter.updateFeature(featureId, { status: "ANALYZING" })

    const execution = await this.aiExecutionService.executeStep({
      featureId,
      workflowRunId: workflowRun.id,
      stepKey: "feature_understanding",
      skillPath: "manual/feature-understanding.skill.md",
      schemaKey: "feature_understanding",
      schemaVersion: "0.1.0",
      modelId,
      contextData: contextStr,
    })

    if (execution.error) {
      await this.dbAdapter.updateFeature(featureId, { status: "FAILED" })
      throw new Error(`Feature understanding failed: ${execution.error}`)
    }

    const understandingJson = execution.artifact?.content_json || {}
    const isReady = understandingJson.ready_for_official_testcases === true

    // Nếu ready_for_official_testcases = true, chuyển status feature thành UNDERSTANDING_REVIEW
    // Nếu vẫn false (nghĩa là còn gaps hoặc câu trả lời chưa làm rõ đủ), trả về trạng thái NEEDS_CLARIFICATION để hỏi tiếp
    const nextStatus = isReady ? "UNDERSTANDING_REVIEW" : "NEEDS_CLARIFICATION"

    if (thread) {
      await this.dbAdapter.updateThreadStatus(thread.id, isReady ? "RESOLVED" : "OPEN")
    }

    await this.dbAdapter.updateFeature(featureId, {
      status: nextStatus,
    })

    return execution.artifact
  }

  /**
   * Tester chính thức Confirm Understanding
   */
  async confirmUnderstanding(artifactId: string, featureId: string, projectId: string): Promise<any> {
    const artifact = await this.dbAdapter.confirmArtifact(artifactId)
    
    await this.dbAdapter.updateFeature(featureId, {
      status: "UNDERSTANDING_CONFIRMED",
    })

    return artifact
  }
}

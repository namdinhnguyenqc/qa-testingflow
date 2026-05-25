import { ModelAdapter, ModelExecutionResult } from "./model-adapter"
import { env } from "@/lib/env"

const PLACEHOLDER_AI_KEYS = new Set(["mock", "dummy-ai-key", "your-ai-api-key"])
const AI_CONFIGURATION_ERROR =
  "AI provider is not configured for team/production mode. Mock output is disabled."

const isPlaceholderAiKey = (value?: string) => {
  if (!value) return true
  return PLACEHOLDER_AI_KEYS.has(value.trim().toLowerCase())
}

export class OpenAICompatibleAdapter implements ModelAdapter {
  providerId = "openai-compatible"

  async executeStructuredTask(input: {
    modelId: string
    systemInstructions: string
    skillInstructions: string
    context: string
    outputSchema: Record<string, any>
  }): Promise<ModelExecutionResult> {
    // 1. Kiểm tra nếu đang sử dụng Dummy Key -> Kích hoạt Mock Fallback thông minh
    if (env.APP_ACCESS_MODE === "demo" && isPlaceholderAiKey(env.AI_PROVIDER_API_KEY)) {
      return this.executeMockTask(input.outputSchema, input.context)
    }

    if (env.APP_ACCESS_MODE !== "demo" && isPlaceholderAiKey(env.AI_PROVIDER_API_KEY)) {
      return {
        rawOutput: "",
        error: AI_CONFIGURATION_ERROR,
        executionMode: "provider",
      }
    }

    // 2. Thực hiện gọi API thật (OpenAI Compatible Endpoint)
    const url = `${env.AI_PROVIDER_BASE_URL || "https://api.openai.com/v1"}/chat/completions`
    
    const messages = [
      {
        role: "system",
        content: `${input.systemInstructions}\n\nQuy tắc nghiệp vụ skill cần tuân thủ:\n${input.skillInstructions}\n\nBẮT BUỘC TRẢ VỀ DẠNG JSON KHỚP VỚI SCHEMA SAU:\n${JSON.stringify(input.outputSchema, null, 2)}`
      },
      {
        role: "user",
        content: `Dưới đây là context tài liệu đầu vào và câu trả lời hiện tại:\n${input.context}\n\nHãy tiến hành thực hiện nhiệm vụ và trả về kết quả dạng JSON nằm trong markdown block \`\`\`json ... \`\`\``
      }
    ]

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.AI_PROVIDER_API_KEY}`,
        },
        body: JSON.stringify({
          model: input.modelId || env.AI_DEFAULT_MODEL || "gpt-4o",
          messages,
          temperature: 0.1, // Thấp để đảm bảo tính nhất quán của cấu trúc
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      const rawOutput = result.choices?.[0]?.message?.content || ""

      // Trích xuất JSON từ markdown block
      const cleanJson = this.extractJson(rawOutput)
      
      return {
        rawOutput,
        parsedOutput: cleanJson ? JSON.parse(cleanJson) : undefined,
        executionMode: "provider",
      }
    } catch (error: any) {
      console.error("❌ OpenAI API call failed:", error)
      return {
        rawOutput: "",
        error: error.message || "Failed to communicate with AI provider",
        executionMode: "provider",
      }
    }
  }

  /**
   * Helper trích xuất JSON nằm giữa dấu ```json ... ```
   */
  private extractJson(text: string): string | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim()
    }
    // Fallback nếu model trả về chuỗi JSON trần không có markdown block
    const trimmed = text.trim()
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
    }
    return null
  }

  /**
   * Trả về dữ liệu mock thông minh khớp hoàn hảo với schemas đầu ra để test luồng E2E
   */
  private executeMockTask(schema: Record<string, any>, context: string): ModelExecutionResult {
    const schemaTitle = schema.title

    let mockJson: Record<string, any> = {}

    if (schemaTitle === "RequirementAnalysis") {
      mockJson = {
        feature_goal: "Cho phép khách hàng thực hiện đăng nhập và quản lý tài khoản cá nhân một cách an toàn.",
        actors: [
          { role: "Guest", description: "Người dùng chưa đăng nhập hệ thống." },
          { role: "Customer", description: "Người dùng đã kích hoạt tài khoản thành công." }
        ],
        preconditions: [
          "Hệ thống cơ sở dữ liệu hoạt động bình thường.",
          "Người dùng đã kết nối mạng internet."
        ],
        flows: [
          {
            name: "Đăng nhập thành công",
            steps: [
              "Người dùng nhập email và mật khẩu hợp lệ.",
              "Bấm nút Đăng nhập.",
              "Hệ thống xác thực và chuyển hướng đến trang Dashboard."
            ]
          }
        ],
        validations: [
          {
            field: "Email",
            rules: [
              "Phải đúng định dạng RFC 5322.",
              "Không được bỏ trống."
            ]
          }
        ],
        business_rules: [
          {
            rule: "Tài khoản bị khóa tạm thời 15 phút nếu nhập sai mật khẩu quá 5 lần liên tiếp.",
            source: "Requirement Doc"
          }
        ],
        missing_critical: [
          {
            rule_key: "lockout_duration_policy",
            description: "Chưa rõ chính sách mở khóa tài khoản sau 15 phút (tự động mở hay cần Admin reset)?",
            reason_critical: "Quyết định Expected Result cho kịch bản đăng nhập sau khi bị khóa."
          }
        ],
        missing_non_critical: [
          {
            rule_key: "remember_me_duration",
            description: "Chưa có quy định thời gian lưu phiên đăng nhập của nút Remember Me."
          }
        ],
        conflicts: [
          {
            sources: ["Requirement Doc Section 2", "Figma Design screen 4"],
            description: "Requirement ghi nút bấm tên là 'Đăng nhập' nhưng Figma design vẽ nút tên là 'Sign In'."
          }
        ],
        assumptions: [
          {
            description: "Hệ thống tự động mở khóa sau 15 phút mà không cần admin reset nghiệp vụ.",
            reason: "Hành vi thông thường của các trang web SaaS hiện đại."
          }
        ]
      }
    } else if (schemaTitle === "ClarificationQuestions") {
      mockJson = {
        questions: [
          {
            question_key: "lockout_duration_policy",
            category: "business_rule",
            question: "Khi tài khoản bị khóa tạm thời 15 phút, sau thời gian này hệ thống tự động mở khóa hay cần liên hệ Admin kích hoạt lại?",
            reason_required: "Xác định Expected Result cho kịch bản đăng nhập của tài khoản sau 15 phút khóa.",
            is_critical: true,
            related_sources: ["Requirement Doc Section 2"]
          }
        ]
      }
    } else if (schemaTitle === "FeatureUnderstanding") {
      // Đánh giá xem đã trả lời câu hỏi khóa tài khoản chưa
      const hasAnswer = context.toLowerCase().includes("tự động mở") || context.toLowerCase().includes("admin")
      
      mockJson = {
        ready_for_official_testcases: hasAnswer,
        goal: "Cho phép khách hàng thực hiện đăng nhập và quản lý tài khoản cá nhân một cách an toàn.",
        actors: [
          { role: "Guest", description: "Người dùng chưa đăng nhập hệ thống." },
          { role: "Customer", description: "Người dùng đã đăng nhập thành công." }
        ],
        preconditions: [
          "Hệ thống cơ sở dữ liệu hoạt động bình thường."
        ],
        flows: [
          {
            name: "Đăng nhập thành công",
            steps: [
              "Nhập email và mật khẩu hợp lệ.",
              "Bấm nút Đăng nhập."
            ]
          }
        ],
        confirmed_business_rules: [
          hasAnswer 
            ? "Tài khoản tự động mở khóa sau 15 phút khóa tạm thời." 
            : "Chưa chốt chính sách mở khóa tài khoản (Tạm thời chặn sinh official TC)."
        ],
        confirmed_validations: [
          {
            field: "Email",
            rules: ["Định dạng email hợp lệ, không trống."]
          }
        ],
        state_transitions: [
          { from: "LoggedOut", to: "LoggedIn", trigger: "Submit valid credentials" }
        ],
        error_handling_rules: [
          "Báo lỗi 'Thông tin đăng nhập không chính xác' khi sai mật khẩu."
        ],
        remaining_non_critical_assumptions: [
          "Mặc định nút Remember Me lưu phiên đăng nhập trong 30 ngày."
        ]
      }
    } else if (schemaTitle === "ManualTestcases") {
      mockJson = {
        test_cases: [
          {
            test_case_code: "TC_AUTH_001",
            module: "Authentication",
            scenario: "Đăng nhập thành công với thông tin hợp lệ",
            case_type: "Happy",
            priority: "P0",
            preconditions: ["Tài khoản khách hàng đã tồn tại và đang hoạt động."],
            steps: [
              { step_no: 1, action: "Truy cập trang đăng nhập.", expected_result: "Trang đăng nhập hiển thị." },
              { step_no: 2, action: "Nhập email 'test@gmail.com' và mật khẩu '12345678'.", expected_result: "Dữ liệu nhập thành công." },
              { step_no: 3, action: "Click button 'Đăng nhập'.", expected_result: "Đăng nhập thành công, chuyển hướng đến Dashboard." }
            ],
            expected_result: "Đăng nhập thành công và chuyển hướng đến trang Dashboard.",
            automation_candidate: true,
            requirement_mapping: ["REQ_AUTH_001"]
          },
          {
            test_case_code: "TC_AUTH_002",
            module: "Authentication",
            scenario: "Đăng nhập thất bại khi bỏ trống trường Email",
            case_type: "Validation",
            priority: "P1",
            preconditions: ["Tài khoản khách hàng đang hoạt động."],
            steps: [
              { step_no: 1, action: "Truy cập trang đăng nhập.", expected_result: "Trang đăng nhập hiển thị." },
              { step_no: 2, action: "Bỏ trống trường email, nhập mật khẩu '12345678'.", expected_result: "Dữ liệu mật khẩu nhập thành công." },
              { step_no: 3, action: "Click button 'Đăng nhập'.", expected_result: "Hiển thị thông báo lỗi 'Email không được bỏ trống'." }
            ],
            expected_result: "Hệ thống báo lỗi validation và chặn gửi request xác thực.",
            automation_candidate: true,
            requirement_mapping: ["REQ_AUTH_002"]
          }
        ]
      }
    }

    return {
      rawOutput: `\`\`\`json\n${JSON.stringify(mockJson, null, 2)}\n\`\`\``,
      parsedOutput: mockJson,
      executionMode: "mock",
    }
  }
}

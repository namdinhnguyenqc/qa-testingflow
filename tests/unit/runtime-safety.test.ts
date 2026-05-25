import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Header } from "@/components/layout/header"

const ORIGINAL_ENV = { ...process.env }

const realSupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://real-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "real-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "real-service-role-key",
  AI_PROVIDER_BASE_URL: "https://api.openai.com/v1",
  AI_DEFAULT_MODEL: "gpt-4o",
}

const resetRuntimeEnv = () => {
  process.env = { ...ORIGINAL_ENV, ...realSupabaseEnv }
  delete process.env.SKIP_ENV_VALIDATION
  delete process.env.NEXT_PHASE
}

const loadAdapter = async () => {
  vi.resetModules()
  vi.doUnmock("@/infrastructure/model/openai-adapter")
  const { OpenAICompatibleAdapter } = await import("@/infrastructure/model/openai-adapter")
  return new OpenAICompatibleAdapter()
}

const executeAdapter = async () => {
  const adapter = await loadAdapter()
  return adapter.executeStructuredTask({
    modelId: "gpt-4o",
    systemInstructions: "system",
    skillInstructions: "skill",
    context: "context",
    outputSchema: { title: "RequirementAnalysis", type: "object" },
  })
}

describe("runtime safety", () => {
  beforeEach(() => {
    resetRuntimeEnv()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doUnmock("@/infrastructure/database/supabase-db-adapter")
    vi.doUnmock("@/infrastructure/skills/skill-loader")
    vi.doUnmock("@/infrastructure/model/openai-adapter")
    vi.doUnmock("@/infrastructure/validation/json-validator")
    process.env = { ...ORIGINAL_ENV }
  })

  it("allows mock AI in demo mode when the AI key is missing", async () => {
    process.env.APP_ACCESS_MODE = "demo"
    delete process.env.AI_PROVIDER_API_KEY

    const result = await executeAdapter()

    expect(result.error).toBeUndefined()
    expect(result.executionMode).toBe("mock")
    expect(result.parsedOutput?.feature_goal).toBeTruthy()
  })

  it("blocks mock fallback in team mode when the AI key is missing", async () => {
    process.env.APP_ACCESS_MODE = "team"
    delete process.env.AI_PROVIDER_API_KEY

    const result = await executeAdapter()

    expect(result.executionMode).toBe("provider")
    expect(result.error).toBe(
      "AI provider is not configured for team/production mode. Mock output is disabled."
    )
    expect(result.parsedOutput).toBeUndefined()
  })

  it.each(["mock", "dummy-ai-key", "your-ai-api-key"])(
    "blocks placeholder AI key %s in production mode",
    async (placeholderKey) => {
      process.env.APP_ACCESS_MODE = "production"
      process.env.AI_PROVIDER_API_KEY = placeholderKey

      const result = await executeAdapter()

      expect(result.executionMode).toBe("provider")
      expect(result.error).toBe(
        "AI provider is not configured for team/production mode. Mock output is disabled."
      )
      expect(result.parsedOutput).toBeUndefined()
    }
  )

  it("marks successful provider results with provider execution mode", async () => {
    process.env.APP_ACCESS_MODE = "team"
    process.env.AI_PROVIDER_API_KEY = "real-provider-key"
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '```json\n{"ok":true}\n```' } }],
        }),
      }))
    )

    const result = await executeAdapter()

    expect(result.error).toBeUndefined()
    expect(result.executionMode).toBe("provider")
    expect(result.parsedOutput).toEqual({ ok: true })
  })

  it("returns provider errors without mock fallback in team mode", async () => {
    process.env.APP_ACCESS_MODE = "team"
    process.env.AI_PROVIDER_API_KEY = "real-provider-key"
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => "provider unavailable",
      }))
    )

    const result = await executeAdapter()

    expect(result.executionMode).toBe("provider")
    expect(result.error).toContain("API Error (503): provider unavailable")
    expect(result.parsedOutput).toBeUndefined()
  })

  it("validates production mode when real runtime configuration is present", async () => {
    process.env.APP_ACCESS_MODE = "production"
    process.env.AI_PROVIDER_API_KEY = "real-provider-key"
    vi.resetModules()

    const { env } = await import("@/lib/env")

    expect(env.APP_ACCESS_MODE).toBe("production")
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(realSupabaseEnv.NEXT_PUBLIC_SUPABASE_URL)
  })

  it("rejects placeholder Supabase URL in production mode", async () => {
    process.env.APP_ACCESS_MODE = "production"
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-supabase-project.supabase.co"
    process.env.AI_PROVIDER_API_KEY = "real-provider-key"
    vi.resetModules()

    await expect(import("@/lib/env")).rejects.toThrow("Invalid environment variables")
  })

  it("rejects placeholder Supabase config in explicit team mode even during tests", async () => {
    process.env.APP_ACCESS_MODE = "team"
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-supabase-project.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-supabase-anon-key"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "your-supabase-service-role-key"
    process.env.AI_PROVIDER_API_KEY = "real-provider-key"
    vi.resetModules()

    await expect(import("@/lib/env")).rejects.toThrow("Invalid environment variables")
  })

  it("shows the demo mock warning in the app header only for demo mode", () => {
    process.env.NEXT_PUBLIC_APP_ACCESS_MODE = "demo"
    const demoMarkup = renderToStaticMarkup(React.createElement(Header))

    process.env.NEXT_PUBLIC_APP_ACCESS_MODE = "team"
    const teamMarkup = renderToStaticMarkup(React.createElement(Header))

    expect(demoMarkup).toContain("Demo / Mock Mode")
    expect(teamMarkup).not.toContain("Demo / Mock Mode")
  })

  it("marks the step failed and does not create an artifact when the provider is not configured", async () => {
    vi.resetModules()
    const createArtifact = vi.fn()
    const updateStepRun = vi.fn(async (_id: string, updates: Record<string, unknown>) => ({
      id: "step-1",
      ...updates,
    }))

    vi.doMock("@/infrastructure/database/supabase-db-adapter", () => ({
      SupabaseDbAdapter: vi.fn().mockImplementation(() => ({
        createStepRun: vi.fn(async () => ({
          id: "step-1",
          workflow_run_id: "run-1",
          feature_id: "feature-1",
          step_key: "requirement_analysis",
          skill_file_path: "skill.md",
          schema_key: "requirement_analysis",
          schema_version: "0.1.0",
          provider_id: "openai-compatible",
          model_id: "gpt-4o",
          input_snapshot_json: {},
          validation_status: "PENDING",
          repair_attempts: 0,
          status: "QUEUED",
          created_at: new Date().toISOString(),
        })),
        updateStepRun,
        createArtifact,
      })),
    }))
    vi.doMock("@/infrastructure/skills/skill-loader", () => ({
      SkillLoader: vi.fn().mockImplementation(() => ({
        loadSkill: vi.fn(async () => "skill"),
        loadSchema: vi.fn(async () => ({ title: "RequirementAnalysis", type: "object" })),
      })),
    }))
    vi.doMock("@/infrastructure/model/openai-adapter", () => ({
      OpenAICompatibleAdapter: vi.fn().mockImplementation(() => ({
        providerId: "openai-compatible",
        executeStructuredTask: vi.fn(async () => ({
          rawOutput: "",
          error: "AI provider is not configured for team/production mode. Mock output is disabled.",
          executionMode: "provider",
        })),
      })),
    }))
    vi.doMock("@/infrastructure/validation/json-validator", () => ({
      JsonValidator: vi.fn().mockImplementation(() => ({
        validateSchema: vi.fn(),
      })),
    }))

    const { AiExecutionService } = await import("@/application/ai/ai-execution-service")
    const service = new AiExecutionService()
    const result = await service.executeStep({
      featureId: "feature-1",
      workflowRunId: "run-1",
      stepKey: "requirement_analysis",
      skillPath: "skill.md",
      schemaKey: "requirement_analysis",
      schemaVersion: "0.1.0",
      modelId: "gpt-4o",
      contextData: "context",
    })

    expect(result.error).toContain("Mock output is disabled")
    expect(result.artifact).toBeUndefined()
    expect(updateStepRun).toHaveBeenCalledWith("step-1", {
      status: "FAILED",
      error_summary:
        "AI Provider Error: AI provider is not configured for team/production mode. Mock output is disabled.",
    })
    expect(createArtifact).not.toHaveBeenCalled()
  })

  it("preserves provider errors from repair attempts instead of converting them to validation errors", async () => {
    vi.resetModules()
    const createArtifact = vi.fn()
    const updateStepRun = vi.fn(async (_id: string, updates: Record<string, unknown>) => ({
      id: "step-1",
      ...updates,
    }))
    const executeStructuredTask = vi
      .fn()
      .mockResolvedValueOnce({
        rawOutput: '```json\n{"wrong":true}\n```',
        parsedOutput: { wrong: true },
        executionMode: "provider",
      })
      .mockResolvedValueOnce({
        rawOutput: "",
        error: "API Error (503): provider unavailable",
        executionMode: "provider",
      })

    vi.doMock("@/infrastructure/database/supabase-db-adapter", () => ({
      SupabaseDbAdapter: vi.fn().mockImplementation(() => ({
        createStepRun: vi.fn(async () => ({
          id: "step-1",
          workflow_run_id: "run-1",
          feature_id: "feature-1",
          step_key: "requirement_analysis",
          skill_file_path: "skill.md",
          schema_key: "requirement_analysis",
          schema_version: "0.1.0",
          provider_id: "openai-compatible",
          model_id: "gpt-4o",
          input_snapshot_json: {},
          validation_status: "PENDING",
          repair_attempts: 0,
          status: "QUEUED",
          created_at: new Date().toISOString(),
        })),
        updateStepRun,
        createArtifact,
      })),
    }))
    vi.doMock("@/infrastructure/skills/skill-loader", () => ({
      SkillLoader: vi.fn().mockImplementation(() => ({
        loadSkill: vi.fn(async () => "skill"),
        loadSchema: vi.fn(async () => ({ title: "RequirementAnalysis", type: "object" })),
      })),
    }))
    vi.doMock("@/infrastructure/model/openai-adapter", () => ({
      OpenAICompatibleAdapter: vi.fn().mockImplementation(() => ({
        providerId: "openai-compatible",
        executeStructuredTask,
      })),
    }))
    vi.doMock("@/infrastructure/validation/json-validator", () => ({
      JsonValidator: vi.fn().mockImplementation(() => ({
        validateSchema: vi.fn(() => ({ isValid: false, errors: ["missing feature_goal"] })),
      })),
    }))

    const { AiExecutionService } = await import("@/application/ai/ai-execution-service")
    const service = new AiExecutionService()
    const result = await service.executeStep({
      featureId: "feature-1",
      workflowRunId: "run-1",
      stepKey: "requirement_analysis",
      skillPath: "skill.md",
      schemaKey: "requirement_analysis",
      schemaVersion: "0.1.0",
      modelId: "gpt-4o",
      contextData: "context",
    })

    expect(result.error).toBe("API Error (503): provider unavailable")
    expect(updateStepRun).toHaveBeenLastCalledWith("step-1", {
      status: "FAILED",
      repair_attempts: 1,
      raw_output_text: "",
      error_summary: "AI Provider Error: API Error (503): provider unavailable",
    })
    expect(createArtifact).not.toHaveBeenCalled()
  })
})

import { z } from "zod"

const placeholderValues = new Set([
  "mock",
  "dummy-ai-key",
  "your-ai-api-key",
  "your-supabase-anon-key",
  "your-supabase-service-role-key",
])

const isPlaceholderValue = (value?: string) => {
  if (!value) return true
  return placeholderValues.has(value.trim().toLowerCase())
}

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("QAFlow AI"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_BUILD_COMMIT: z.string().default("local"),
  
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  AI_PROVIDER_TYPE: z.string().optional().default("openai"),
  AI_PROVIDER_BASE_URL: z.string().url().optional(),
  AI_PROVIDER_API_KEY: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().optional().default("gpt-4o"),

  APP_ACCESS_MODE: z.enum(["demo", "team", "production"]).default("demo"),
}).superRefine((data, ctx) => {
  if (data.APP_ACCESS_MODE === "demo") return

  if (
    data.NEXT_PUBLIC_SUPABASE_URL.includes("mock.supabase.co") ||
    data.NEXT_PUBLIC_SUPABASE_URL.includes("your-supabase-project.supabase.co")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["NEXT_PUBLIC_SUPABASE_URL"],
      message: "Team/production mode requires a real Supabase URL.",
    })
  }

  if (isPlaceholderValue(data.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      message: "Team/production mode requires a real Supabase anon key.",
    })
  }

  if (isPlaceholderValue(data.SUPABASE_SERVICE_ROLE_KEY)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SUPABASE_SERVICE_ROLE_KEY"],
      message: "Team/production mode requires a real Supabase service role key.",
    })
  }
})

const getEnv = () => {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    APP_BUILD_COMMIT: process.env.APP_BUILD_COMMIT,
    
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    AI_PROVIDER_TYPE: process.env.AI_PROVIDER_TYPE,
    AI_PROVIDER_BASE_URL: process.env.AI_PROVIDER_BASE_URL,
    AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY,
    AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,

    APP_ACCESS_MODE: process.env.APP_ACCESS_MODE,
  })

  if (!result.success) {
    const requestedAccessMode = process.env.APP_ACCESS_MODE
    const allowsMockEnvFallback = !requestedAccessMode || requestedAccessMode === "demo"
    const isBuild =
      (process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.NODE_ENV === "test") &&
      allowsMockEnvFallback
    const explicitNonProductionSkip =
      process.env.SKIP_ENV_VALIDATION === "true" &&
      process.env.NODE_ENV !== "production" &&
      allowsMockEnvFallback
    const isBuildOrTest = isBuild || explicitNonProductionSkip

    if (isBuildOrTest) {
      console.warn("⚠️ Invalid environment variables during build/test, using mock values.")
      return {
        NEXT_PUBLIC_APP_NAME: "QAFlow AI",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        APP_BUILD_COMMIT: "local",
        NEXT_PUBLIC_SUPABASE_URL: "https://mock.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock",
        SUPABASE_SERVICE_ROLE_KEY: "mock",
        AI_PROVIDER_TYPE: "openai",
        AI_PROVIDER_BASE_URL: "https://api.openai.com/v1",
        AI_PROVIDER_API_KEY: "mock",
        AI_DEFAULT_MODEL: "gpt-4o",
        APP_ACCESS_MODE: "demo" as const,
      }
    } else {
      console.error("❌ CRITICAL: Invalid environment variables at runtime:", result.error.format())
      throw new Error(
        `Critical: Invalid environment variables at runtime! Please verify your .env.local file. Details: ${JSON.stringify(
          result.error.format()
        )}`
      )
    }
  }

  return result.data
}

export const env = getEnv()
export type Env = z.infer<typeof envSchema>

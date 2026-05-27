import { env } from "@/lib/env"
import { ModelAdapter } from "./model-adapter"
import { OpenAICompatibleAdapter } from "./openai-adapter"

export function createModelAdapter(): ModelAdapter {
  switch (env.AI_PROVIDER_TYPE) {
    case "openai-compatible":
      return new OpenAICompatibleAdapter()
    default: {
      const exhaustiveCheck: never = env.AI_PROVIDER_TYPE
      throw new Error(`Unsupported AI provider type: ${exhaustiveCheck}`)
    }
  }
}

export interface ModelExecutionResult {
  rawOutput: string
  parsedOutput?: Record<string, any>
  error?: string
  executionMode: "mock" | "provider"
}

export interface ModelAdapter {
  providerId: string
  executeStructuredTask(input: {
    modelId: string
    systemInstructions: string
    skillInstructions: string
    context: string
    outputSchema: Record<string, any>
  }): Promise<ModelExecutionResult>
}

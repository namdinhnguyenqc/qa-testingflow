import { TestCase } from "./types"

export function validateEditableTestCases(
  cases: Pick<TestCase, "test_case_code" | "module" | "scenario" | "expected_result" | "steps_json">[]
): void {
  if (cases.length === 0) {
    throw new Error("At least one test case is required before saving final version.")
  }

  const seenCodes = new Set<string>()
  for (const testCase of cases) {
    const code = testCase.test_case_code.trim()
    if (!code) throw new Error("Test Case ID is required.")
    if (seenCodes.has(code)) throw new Error(`Duplicate Test Case ID found: ${code}`)
    seenCodes.add(code)

    if (!testCase.module.trim()) throw new Error(`Module is required for ${code}.`)
    if (!testCase.scenario.trim()) throw new Error(`Scenario is required for ${code}.`)
    if (!testCase.expected_result.trim()) throw new Error(`Expected Result is required for ${code}.`)
    if (!Array.isArray(testCase.steps_json) || testCase.steps_json.length === 0) {
      throw new Error(`At least one step is required for ${code}.`)
    }
  }
}

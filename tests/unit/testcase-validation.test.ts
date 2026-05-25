import { describe, expect, it } from "vitest"
import { validateEditableTestCases } from "@/domain/testcases/validation"

const validCase = {
  test_case_code: "TC_AUTH_001",
  module: "Authentication",
  scenario: "Login succeeds with valid credentials",
  expected_result: "User is redirected to dashboard.",
  steps_json: [{ step_no: 1, action: "Submit valid credentials", expected_result: "Login succeeds" }],
}

describe("Manual testcase final validation", () => {
  it("allows a valid editable testcase set", () => {
    expect(() => validateEditableTestCases([validCase])).not.toThrow()
  })

  it("requires at least one testcase", () => {
    expect(() => validateEditableTestCases([])).toThrow("At least one test case is required")
  })

  it("rejects duplicate testcase IDs", () => {
    expect(() => validateEditableTestCases([validCase, { ...validCase }])).toThrow(
      "Duplicate Test Case ID found: TC_AUTH_001"
    )
  })

  it("rejects missing expected result before final save", () => {
    expect(() =>
      validateEditableTestCases([{ ...validCase, expected_result: " " }])
    ).toThrow("Expected Result is required for TC_AUTH_001.")
  })
})

import { describe, expect, it } from "vitest"
import { diffTestCaseSets } from "@/domain/testcases/diff"
import { TestCase } from "@/domain/testcases/types"

function makeTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: "tc-1",
    feature_id: "feature-1",
    artifact_id: "generated-artifact",
    test_case_code: "TC_AUTH_001",
    module: "Authentication",
    scenario: "Login succeeds with valid credentials",
    case_type: "Happy",
    priority: "P1",
    preconditions_json: ["User account exists"],
    steps_json: [
      {
        step_no: 1,
        action: "Open login page",
        expected_result: "Login page is visible",
      },
    ],
    test_data_json: { email: "user@example.com", password: "secret" },
    expected_result: "User lands on dashboard.",
    automation_candidate: true,
    requirement_mapping_json: ["REQ_AUTH_001"],
    status: "DRAFT",
    created_at: "2026-05-27T00:00:00.000Z",
    ...overrides,
  }
}

describe("Phase 02 testcase set diff", () => {
  it("summarizes added, removed, and modified test cases", () => {
    const generated = [
      makeTestCase(),
      makeTestCase({
        id: "tc-2",
        test_case_code: "TC_AUTH_002",
        scenario: "Login fails with invalid password",
      }),
    ]
    const final = [
      makeTestCase({
        artifact_id: "final-artifact",
        priority: "P0",
        expected_result: "User lands on dashboard and sees the account menu.",
        status: "FINAL",
      }),
      makeTestCase({
        id: "tc-3",
        artifact_id: "final-artifact",
        test_case_code: "TC_AUTH_003",
        scenario: "Account is locked after repeated failures",
        case_type: "Negative",
        priority: "P0",
        status: "FINAL",
      }),
    ]

    const diff = diffTestCaseSets(generated, final)

    expect(diff.summary).toEqual({
      addedCount: 1,
      removedCount: 1,
      modifiedCount: 1,
      editedFieldCount: 2,
    })
    expect(diff.added.map((testCase) => testCase.test_case_code)).toEqual(["TC_AUTH_003"])
    expect(diff.removed.map((testCase) => testCase.test_case_code)).toEqual(["TC_AUTH_002"])
    expect(diff.modified).toEqual([
      {
        testCaseCode: "TC_AUTH_001",
        changes: [
          {
            field: "priority",
            generatedValue: "P1",
            finalValue: "P0",
          },
          {
            field: "expected_result",
            generatedValue: "User lands on dashboard.",
            finalValue: "User lands on dashboard and sees the account menu.",
          },
        ],
      },
    ])
  })

  it("compares object fields without being sensitive to object key order", () => {
    const generated = [
      makeTestCase({
        test_data_json: { email: "user@example.com", password: "secret" },
      }),
    ]
    const final = [
      makeTestCase({
        test_data_json: { password: "secret", email: "user@example.com" },
      }),
    ]

    const diff = diffTestCaseSets(generated, final)

    expect(diff.summary.editedFieldCount).toBe(0)
    expect(diff.modified).toEqual([])
  })
})

import { TestCase } from "./types"

export type TestCaseDiffField = keyof Pick<
  TestCase,
  | "module"
  | "scenario"
  | "case_type"
  | "priority"
  | "preconditions_json"
  | "steps_json"
  | "test_data_json"
  | "expected_result"
  | "automation_candidate"
  | "requirement_mapping_json"
>

export interface TestCaseFieldChange {
  field: TestCaseDiffField
  generatedValue: TestCase[TestCaseDiffField]
  finalValue: TestCase[TestCaseDiffField]
}

export interface TestCaseModifiedDiff {
  testCaseCode: string
  changes: TestCaseFieldChange[]
}

export interface TestCaseSetDiff {
  added: TestCase[]
  removed: TestCase[]
  modified: TestCaseModifiedDiff[]
  summary: {
    addedCount: number
    removedCount: number
    modifiedCount: number
    editedFieldCount: number
  }
}

const DIFF_FIELDS: TestCaseDiffField[] = [
  "module",
  "scenario",
  "case_type",
  "priority",
  "preconditions_json",
  "steps_json",
  "test_data_json",
  "expected_result",
  "automation_candidate",
  "requirement_mapping_json",
]

export function diffTestCaseSets(generatedCases: TestCase[], finalCases: TestCase[]): TestCaseSetDiff {
  const generatedByCode = new Map(generatedCases.map((testCase) => [testCase.test_case_code, testCase]))
  const finalByCode = new Map(finalCases.map((testCase) => [testCase.test_case_code, testCase]))

  const added = finalCases.filter((testCase) => !generatedByCode.has(testCase.test_case_code))
  const removed = generatedCases.filter((testCase) => !finalByCode.has(testCase.test_case_code))

  const modified = finalCases
    .map((finalCase) => {
      const generatedCase = generatedByCode.get(finalCase.test_case_code)
      if (!generatedCase) return null

      const changes = DIFF_FIELDS.flatMap((field) => {
        if (stableStringify(generatedCase[field]) === stableStringify(finalCase[field])) return []
        return [
          {
            field,
            generatedValue: generatedCase[field],
            finalValue: finalCase[field],
          },
        ]
      })

      if (changes.length === 0) return null
      return {
        testCaseCode: finalCase.test_case_code,
        changes,
      }
    })
    .filter((diff): diff is TestCaseModifiedDiff => diff !== null)

  const editedFieldCount = modified.reduce((total, diff) => total + diff.changes.length, 0)

  return {
    added,
    removed,
    modified,
    summary: {
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
      editedFieldCount,
    },
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableComparison(value))
}

function sortForStableComparison(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableComparison)
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortForStableComparison((value as Record<string, unknown>)[key])
        return sorted
      }, {})
  }

  return value
}

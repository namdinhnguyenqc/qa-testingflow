import ExcelJS from "exceljs"
import { describe, expect, it } from "vitest"
import { ExcelExportService } from "@/application/exports/excel-export-service"
import { TestCase } from "@/domain/testcases/types"

const testCase: TestCase = {
  id: "tc-1",
  feature_id: "feature-1",
  artifact_id: "artifact-1",
  test_case_code: "TC_AUTH_001",
  module: "Authentication",
  scenario: "Login succeeds with valid credentials",
  case_type: "Happy",
  priority: "P0",
  preconditions_json: ["User account exists"],
  steps_json: [
    {
      step_no: 1,
      action: "Submit valid credentials",
      expected_result: "Dashboard is displayed",
    },
  ],
  test_data_json: { email: "user@example.com" },
  expected_result: "User is redirected to dashboard.",
  automation_candidate: true,
  requirement_mapping_json: ["REQ_AUTH_001"],
  status: "FINAL",
  created_at: new Date().toISOString(),
}

describe("Excel testcase export", () => {
  it("exports the expected testcase columns and rows", async () => {
    const buffer = await new ExcelExportService().exportTestCasesToBuffer("CRM", "Login", [testCase])
    const workbook = new ExcelJS.Workbook()
    const workbookData = buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
    await workbook.xlsx.load(workbookData)

    const worksheet = workbook.getWorksheet("Test Cases")
    expect(worksheet).toBeDefined()

    const headerValues = worksheet!.getRow(5).values
    expect(headerValues).toEqual([
      ,
      "Test Case ID",
      "Module",
      "Test Scenario",
      "Case Type",
      "Priority",
      "Preconditions",
      "Test Steps",
      "Test Data",
      "Expected Result",
      "Auto Candidate",
      "Req Mapping",
      "Status",
    ])

    const row = worksheet!.getRow(6)
    expect(row.getCell(1).value).toBe("TC_AUTH_001")
    expect(row.getCell(2).value).toBe("Authentication")
    expect(row.getCell(9).value).toBe("User is redirected to dashboard.")
    expect(row.getCell(10).value).toBe("Yes")
    expect(row.getCell(11).value).toBe("REQ_AUTH_001")
    expect(row.getCell(12).value).toBe("FINAL")
  })
})

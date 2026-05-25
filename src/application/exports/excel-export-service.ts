import ExcelJS from "exceljs"
import { TestCase } from "@/domain/testcases/types"

export class ExcelExportService {
  /**
   * Sinh tệp Excel từ danh sách Test Cases và cấu hình kiểu dáng premium
   */
  async exportTestCasesToBuffer(projectName: string, featureName: string, testCases: TestCase[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "QAFlow AI"
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet("Test Cases", {
      views: [{ showGridLines: true }],
    })

    // 1. Tạo Header Metadata Dự án (Dòng 1 đến 3)
    worksheet.mergeCells("A1:L1")
    const titleCell = worksheet.getCell("A1")
    titleCell.value = `QA TESTING REPORT — ${projectName.toUpperCase()}`
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } }
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF312E81" }, // Deep Indigo background
    }
    titleCell.alignment = { vertical: "middle", horizontal: "center" }
    worksheet.getRow(1).height = 40

    worksheet.getCell("A2").value = "Feature Name:"
    worksheet.getCell("A2").font = { bold: true }
    worksheet.getCell("B2").value = featureName
    
    worksheet.getCell("A3").value = "Exported Date:"
    worksheet.getCell("A3").font = { bold: true }
    worksheet.getCell("B3").value = new Date().toLocaleString()

    worksheet.addRow([]) // Dòng trống ngăn cách

    // 2. Định nghĩa các cột
    const columns = [
      { header: "Test Case ID", key: "test_case_code", width: 15 },
      { header: "Module", key: "module", width: 15 },
      { header: "Test Scenario", key: "scenario", width: 35 },
      { header: "Case Type", key: "case_type", width: 15 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Preconditions", key: "preconditions", width: 30 },
      { header: "Test Steps", key: "steps", width: 40 },
      { header: "Test Data", key: "test_data", width: 25 },
      { header: "Expected Result", key: "expected_result", width: 35 },
      { header: "Auto Candidate", key: "automation_candidate", width: 15 },
      { header: "Req Mapping", key: "requirement_mapping", width: 15 },
      { header: "Status", key: "status", width: 10 },
    ]

    // Thêm Table Header (Dòng 5)
    const headerRow = worksheet.addRow(columns.map((c) => c.header))
    headerRow.height = 25
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E1B4B" }, // Midnight Charcoal/Indigo
      }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
      cell.border = {
        top: { style: "thin", color: { argb: "FF374151" } },
        bottom: { style: "medium", color: { argb: "FF374151" } },
        left: { style: "thin", color: { argb: "FF374151" } },
        right: { style: "thin", color: { argb: "FF374151" } },
      }
    })

    // 3. Đổ dữ liệu
    testCases.forEach((tc) => {
      // Chuẩn hóa preconditions array thành string xuống dòng
      const preconditionsStr = Array.isArray(tc.preconditions_json)
        ? tc.preconditions_json.map((p) => `• ${p}`).join("\n")
        : tc.preconditions_json || ""

      // Chuẩn hóa steps thành string xuống dòng
      const stepsStr = Array.isArray(tc.steps_json)
        ? tc.steps_json.map((s) => `${s.step_no}. ${s.action}\n➔ Expected: ${s.expected_result}`).join("\n\n")
        : ""

      // Chuẩn hóa test data
      const testDataStr = tc.test_data_json 
        ? Object.entries(tc.test_data_json).map(([k, v]) => `${k}: ${v}`).join("\n") 
        : ""

      const reqMappingStr = Array.isArray(tc.requirement_mapping_json)
        ? tc.requirement_mapping_json.join(", ")
        : ""

      const dataRow = worksheet.addRow([
        tc.test_case_code,
        tc.module,
        tc.scenario,
        tc.case_type,
        tc.priority,
        preconditionsStr,
        stepsStr,
        testDataStr,
        tc.expected_result,
        tc.automation_candidate ? "Yes" : "No",
        reqMappingStr,
        tc.status,
      ])

      dataRow.height = 60 // Tăng chiều cao để wrap text đẹp
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 10 }
        cell.alignment = {
          vertical: "top",
          horizontal: [1, 2, 4, 5, 10, 11, 12].includes(colNumber) ? "center" : "left",
          wrapText: true,
        }
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        }

        // Color status badge
        if (colNumber === 12) {
          if (cell.value === "FINAL") {
            cell.font = { bold: true, color: { argb: "FF047857" } } // Emerald green
          } else {
            cell.font = { italic: true, color: { argb: "FF6B7280" } } // Gray
          }
        }
      })
    })

    // 4. Auto-fit column widths
    worksheet.columns = columns.map((col, index) => ({
      ...col,
      width: col.width, // giữ width định vị sẵn để cân đối
    }))

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer as ArrayBuffer)
  }
}

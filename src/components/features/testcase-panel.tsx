"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Loader2, Sparkles, AlertTriangle, FileSpreadsheet, Plus, Trash2, Save, CheckCircle2 } from "lucide-react"
import { getLatestArtifactByTypeAction, generateTestCasesAction, getTestCasesAction, updateTestCaseAction, createManualTestCaseAction, deleteTestCaseAction, saveFinalTestCaseVersionAction } from "@/app/actions"
import { Feature } from "@/domain/features/types"
import { Artifact } from "@/domain/artifacts/types"
import { TestCase, CaseType, Priority } from "@/domain/testcases/types"

interface TestCasePanelProps {
  projectId: string
  feature: Feature
  onRefresh: () => void
}

export function TestCasePanel({ projectId, feature, onRefresh }: TestCasePanelProps) {
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof TestCase } | null>(null)

  const fetchArtifactAndTestCases = useCallback(async () => {
    setErrorMsg(null)
    try {
      // 1. Lấy artifact TESTCASE_FINAL (nếu đã chốt) hoặc TESTCASE_SET (nếu đang draft) gần nhất
      let artResult = await getLatestArtifactByTypeAction(feature.id, "TESTCASE_FINAL")
      if (artResult.error) throw new Error(artResult.error)
      
      let currentArt = artResult.data || null
      
      if (!currentArt) {
        artResult = await getLatestArtifactByTypeAction(feature.id, "TESTCASE_SET")
        if (artResult.error) throw new Error(artResult.error)
        currentArt = artResult.data || null
      }

      setArtifact(currentArt)

      // 2. Lấy danh sách test cases thuộc artifact này
      if (currentArt) {
        const tcResult = await getTestCasesAction(currentArt.id)
        if (tcResult.error) throw new Error(tcResult.error)
        setTestCases(tcResult.data || [])
      } else {
        setTestCases([])
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load test cases")
    } finally {
      setLoading(false)
    }
  }, [feature.id])

  useEffect(() => {
    fetchArtifactAndTestCases()
  }, [fetchArtifactAndTestCases])

  // === AI sinh kịch bản kiểm thử ===
  const handleGenerateTestCases = async (isDraft = false) => {
    setRunning(true)
    setErrorMsg(null)
    try {
      const result = await generateTestCasesAction(
        projectId,
        feature.id,
        "gpt-4o",
        isDraft
      )
      if (result.error) throw new Error(result.error)
      
      await fetchArtifactAndTestCases()
      onRefresh()
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setRunning(false)
    }
  }

  // === Chỉnh sửa inline testcase ===
  const handleCellBlur = async (id: string, field: keyof TestCase, value: string | boolean) => {
    setEditingCell(null)
    
    // Tìm testcase gốc để so sánh
    const original = testCases.find((tc) => tc.id === id)
    if (!original) return

    let updatedValue = value
    // Tránh lưu nếu không có thay đổi
    if (original[field] === updatedValue) return

    try {
      const result = await updateTestCaseAction(
        id,
        { [field]: updatedValue },
        artifact!.id,
        projectId,
        feature.id
      )
      if (result.error) throw new Error(result.error)
      
      // Cập nhật state cục bộ
      setTestCases((prev) =>
        prev.map((tc) => (tc.id === id ? { ...tc, [field]: updatedValue } as any : tc))
      )
      
      setSuccessMsg("Lưu thay đổi thành công!")
      setTimeout(() => setSuccessMsg(null), 2000)
    } catch (error: any) {
      setErrorMsg(`Không thể lưu thay đổi: ${error.message}`)
    }
  }

  // === Thêm dòng testcase thủ công ===
  const handleAddRow = async () => {
    if (!artifact) return
    const nextCode = `TC_MANUAL_${Date.now().toString().slice(-4)}`
    
    const dto = {
      feature_id: feature.id,
      artifact_id: artifact.id,
      test_case_code: nextCode,
      module: "General",
      scenario: "New Manual Test Case kịch bản",
      case_type: "Happy" as CaseType,
      priority: "P1" as Priority,
      preconditions_json: ["Precondition description"],
      steps_json: [{ step_no: 1, action: "Step 1 action", expected_result: "Step 1 expected" }],
      expected_result: "Expected Result description",
      automation_candidate: false,
    }

    try {
      const result = await createManualTestCaseAction(dto, projectId)
      if (result.error) throw new Error(result.error)
      
      if (result.data) {
        setTestCases((prev) => [...prev, result.data])
      }
    } catch (error: any) {
      setErrorMsg(`Không thể thêm dòng: ${error.message}`)
    }
  }

  // === Xoá dòng testcase ===
  const handleDeleteRow = async (id: string) => {
    if (confirm("Are you sure you want to delete this test case row?")) {
      try {
        const result = await deleteTestCaseAction(id, artifact!.id, projectId, feature.id)
        if (result.error) throw new Error(result.error)
        
        setTestCases((prev) => prev.filter((tc) => tc.id !== id))
      } catch (error: any) {
        setErrorMsg(`Không thể xóa dòng: ${error.message}`)
      }
    }
  }

  // === Lưu phiên bản Final ===
  const handleSaveFinalVersion = async () => {
    if (!artifact) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const result = await saveFinalTestCaseVersionAction(feature.id, artifact.id, projectId)
      if (result.error) throw new Error(result.error)
      
      setSuccessMsg("Đã chốt và lưu phiên bản Final kịch bản kiểm thử!")
      setTimeout(() => setSuccessMsg(null), 3000)
      
      await fetchArtifactAndTestCases()
      onRefresh()
    } catch (error: any) {
      setErrorMsg(`Lưu phiên bản Final thất bại: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-card border border-border rounded-xl">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const isFinal = artifact?.artifact_type === "TESTCASE_FINAL"
  const isGateBlocked = feature.status === "DRAFT" || feature.status === "INPUT_READY" || feature.status === "NEEDS_CLARIFICATION" || feature.status === "READY_FOR_UNDERSTANDING" || feature.status === "UNDERSTANDING_REVIEW"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Toolbar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <FileSpreadsheet className="w-4.5 h-4.5 text-primary" />
            Test Case Set Editor ({testCases.length})
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {isFinal 
              ? "Bản Final kịch bản kiểm thử đã được lưu bền vững. Sẵn sàng cho việc xuất Excel."
              : "Tester chỉnh sửa trực tiếp, thêm hoặc xóa kịch bản để chuẩn hóa bản testcase set."}
          </p>
        </div>

        {/* Nút bấm Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          {artifact && !isFinal && (
            <button
              onClick={handleSaveFinalVersion}
              disabled={saving}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Final Version
            </button>
          )}

          {artifact && (
            <a
              href={`/api/export/${artifact.id}`}
              className="px-3.5 py-2 bg-secondary border border-border hover:bg-secondary/80 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Export Excel (.xlsx)
            </a>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Main Content Area */}
      {!artifact ? (
        <div className="flex flex-col items-center justify-center p-16 border border-border border-dashed rounded-xl bg-card text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Sẵn sàng sinh kịch bản</h4>
          
          {isGateBlocked ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Nghiệp vụ chưa được chốt hoặc hiểu biết tính năng chưa được tester xác nhận. Bạn có thể chọn sinh bản nháp (Draft with Assumptions).
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleGenerateTestCases(true)}
                  disabled={running}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Generate Draft Only
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Hiểu biết tính năng đã được tester chốt thành công! Sẵn sàng sinh bộ test case chính thức (Official Test Cases).
              </p>
              <button
                onClick={() => handleGenerateTestCases(false)}
                disabled={running}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/30 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 cursor-pointer mx-auto"
              >
                {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Official Test Cases
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 w-32">Test Case ID</th>
                  <th className="px-4 py-3 w-36">Module</th>
                  <th className="px-4 py-3">Test Scenario</th>
                  <th className="px-4 py-3 w-32">Case Type</th>
                  <th className="px-4 py-3 w-24">Priority</th>
                  <th className="px-4 py-3">Expected Result</th>
                  <th className="px-4 py-3 w-24 text-center">Auto?</th>
                  {!isFinal && <th className="px-4 py-3 w-16 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {testCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-secondary/10 transition-colors group">
                    {/* ID */}
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {isFinal ? (
                        tc.test_case_code
                      ) : (
                        <input
                          type="text"
                          defaultValue={tc.test_case_code}
                          onBlur={(e) => handleCellBlur(tc.id, "test_case_code", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary focus:bg-secondary rounded px-1 text-xs font-semibold text-foreground focus:outline-none"
                        />
                      )}
                    </td>

                    {/* Module */}
                    <td className="px-4 py-3">
                      {isFinal ? (
                        tc.module
                      ) : (
                        <input
                          type="text"
                          defaultValue={tc.module}
                          onBlur={(e) => handleCellBlur(tc.id, "module", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary focus:bg-secondary rounded px-1 text-xs text-foreground focus:outline-none"
                        />
                      )}
                    </td>

                    {/* Scenario */}
                    <td className="px-4 py-3">
                      {isFinal ? (
                        tc.scenario
                      ) : (
                        <textarea
                          rows={2}
                          defaultValue={tc.scenario}
                          onBlur={(e) => handleCellBlur(tc.id, "scenario", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary focus:bg-secondary rounded px-1 text-xs text-foreground focus:outline-none resize-y"
                        />
                      )}
                    </td>

                    {/* Case Type */}
                    <td className="px-4 py-3">
                      {isFinal ? (
                        tc.case_type
                      ) : (
                        <select
                          defaultValue={tc.case_type}
                          onChange={(e) => handleCellBlur(tc.id, "case_type", e.target.value)}
                          className="bg-transparent border-0 focus:ring-1 focus:ring-primary focus:bg-secondary rounded text-xs text-foreground focus:outline-none font-semibold cursor-pointer"
                        >
                          <option value="Happy">Happy</option>
                          <option value="Validation">Validation</option>
                          <option value="Negative">Negative</option>
                          <option value="Boundary">Boundary</option>
                          <option value="Permission">Permission</option>
                          <option value="UI">UI</option>
                          <option value="Error Handling">Error Handling</option>
                          <option value="Regression">Regression</option>
                        </select>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      {isFinal ? (
                        tc.priority
                      ) : (
                        <select
                          defaultValue={tc.priority}
                          onChange={(e) => handleCellBlur(tc.id, "priority", e.target.value)}
                          className="bg-transparent border-0 focus:ring-1 focus:ring-primary focus:bg-secondary rounded text-xs text-foreground focus:outline-none font-bold cursor-pointer"
                        >
                          <option value="P0">P0</option>
                          <option value="P1">P1</option>
                          <option value="P2">P2</option>
                          <option value="P3">P3</option>
                        </select>
                      )}
                    </td>

                    {/* Expected Result */}
                    <td className="px-4 py-3">
                      {isFinal ? (
                        tc.expected_result
                      ) : (
                        <textarea
                          rows={2}
                          defaultValue={tc.expected_result}
                          onBlur={(e) => handleCellBlur(tc.id, "expected_result", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary focus:bg-secondary rounded px-1 text-xs text-foreground focus:outline-none resize-y"
                        />
                      )}
                    </td>

                    {/* Auto Candidate */}
                    <td className="px-4 py-3 text-center">
                      {isFinal ? (
                        tc.automation_candidate ? "Yes" : "No"
                      ) : (
                        <input
                          type="checkbox"
                          defaultChecked={tc.automation_candidate}
                          onChange={(e) => handleCellBlur(tc.id, "automation_candidate", e.target.checked)}
                          className="w-4 h-4 rounded border-border focus:ring-1 focus:ring-primary text-primary bg-secondary cursor-pointer"
                        />
                      )}
                    </td>

                    {/* Delete Action */}
                    {!isFinal && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteRow(tc.id)}
                          className="p-1 rounded hover:bg-secondary text-destructive hover:text-destructive/80 transition-colors"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button (Dành cho Draft) */}
          {!isFinal && (
            <div className="flex justify-start">
              <button
                onClick={handleAddRow}
                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 text-primary" />
                Add Test Case Row
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

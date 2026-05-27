"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, BarChart3, GitCompare, Loader2, Medal, MessageSquarePlus, Save } from "lucide-react"
import {
  createArtifactFeedbackAction,
  createModelComparisonSnapshotAction,
  getFeatureEvaluationSummaryAction,
  getFeatureHistoryAction,
  getGeneratedVsFinalDiffAction,
} from "@/app/actions"
import { Artifact } from "@/domain/artifacts/types"
import {
  ArtifactFeedback,
  ArtifactFeedbackIssueCategory,
  ArtifactFeedbackRating,
  EvaluationMetrics,
} from "@/domain/evaluations/types"
import { TestCaseSetDiff } from "@/domain/testcases/diff"

interface EvaluationPanelProps {
  projectId: string
  featureId: string
}

const ISSUE_OPTIONS: { value: ArtifactFeedbackIssueCategory; label: string }[] = [
  { value: "missing_rule", label: "Missing rule" },
  { value: "duplicate_case", label: "Duplicate case" },
  { value: "unclear_expected_result", label: "Unclear expected result" },
  { value: "wrong_format", label: "Wrong format" },
  { value: "unnecessary_questions", label: "Unnecessary questions" },
]

export function EvaluationPanel({ projectId, featureId }: EvaluationPanelProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null)
  const [feedbackHistory, setFeedbackHistory] = useState<ArtifactFeedback[]>([])
  const [generatedArtifactId, setGeneratedArtifactId] = useState("")
  const [finalArtifactId, setFinalArtifactId] = useState("")
  const [feedbackArtifactId, setFeedbackArtifactId] = useState("")
  const [rating, setRating] = useState<ArtifactFeedbackRating>("GOOD")
  const [issues, setIssues] = useState<ArtifactFeedbackIssueCategory[]>([])
  const [comment, setComment] = useState("")
  const [goldenCandidate, setGoldenCandidate] = useState(false)
  const [modelAId, setModelAId] = useState("model-a")
  const [modelBId, setModelBId] = useState("model-b")
  const [diff, setDiff] = useState<TestCaseSetDiff | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const generatedArtifacts = useMemo(
    () => artifacts.filter((artifact) => artifact.artifact_type === "TESTCASE_SET"),
    [artifacts]
  )
  const finalArtifacts = useMemo(
    () => artifacts.filter((artifact) => artifact.artifact_type === "TESTCASE_FINAL"),
    [artifacts]
  )

  const loadEvaluation = useCallback(async () => {
    setErrorMsg(null)
    try {
      const [historyResult, summaryResult] = await Promise.all([
        getFeatureHistoryAction(featureId),
        getFeatureEvaluationSummaryAction(featureId),
      ])
      if (historyResult.error) throw new Error(historyResult.error)
      if (summaryResult.error) throw new Error(summaryResult.error)

      const loadedArtifacts = historyResult.data?.artifacts || []
      setArtifacts(loadedArtifacts)
      setMetrics(summaryResult.data?.metrics || null)
      setFeedbackHistory(summaryResult.data?.feedback || [])

      const firstGenerated = loadedArtifacts.find((artifact) => artifact.artifact_type === "TESTCASE_SET")
      const firstFinal = loadedArtifacts.find((artifact) => artifact.artifact_type === "TESTCASE_FINAL")
      setGeneratedArtifactId((current) => current || firstGenerated?.id || "")
      setFinalArtifactId((current) => current || firstFinal?.id || "")
      setFeedbackArtifactId((current) => current || firstFinal?.id || firstGenerated?.id || loadedArtifacts[0]?.id || "")
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load evaluation data")
    } finally {
      setLoading(false)
    }
  }, [featureId])

  useEffect(() => {
    loadEvaluation()
  }, [loadEvaluation])

  const handleIssueToggle = (issue: ArtifactFeedbackIssueCategory) => {
    setIssues((current) => (current.includes(issue) ? current.filter((item) => item !== issue) : [...current, issue]))
  }

  const handleSaveFeedback = async () => {
    if (!feedbackArtifactId) return
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const result = await createArtifactFeedbackAction(
        {
          artifact_id: feedbackArtifactId,
          feature_id: featureId,
          generated_artifact_id: generatedArtifactId || undefined,
          final_artifact_id: finalArtifactId || undefined,
          rating,
          issue_categories: issues,
          comment: comment.trim() || undefined,
          is_golden_candidate: goldenCandidate,
        },
        projectId
      )
      if (result.error) throw new Error(result.error)
      setSuccessMsg("Feedback saved.")
      setComment("")
      await loadEvaluation()
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to save feedback")
    } finally {
      setSaving(false)
    }
  }

  const handleLoadDiff = async () => {
    if (!generatedArtifactId || !finalArtifactId) return
    setErrorMsg(null)
    try {
      const result = await getGeneratedVsFinalDiffAction(generatedArtifactId, finalArtifactId)
      if (result.error) throw new Error(result.error)
      setDiff(result.data || null)
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load testcase diff")
    }
  }

  const handleCreateComparison = async () => {
    if (!generatedArtifactId || !finalArtifactId) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const result = await createModelComparisonSnapshotAction({
        featureId,
        projectId,
        stepKey: "testcase_generation",
        modelAId,
        modelBId,
        artifactAId: generatedArtifactId,
        artifactBId: finalArtifactId,
      })
      if (result.error) throw new Error(result.error)
      setSuccessMsg("Evaluation comparison snapshot saved.")
      await loadEvaluation()
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to save comparison snapshot")
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

  return (
    <div className="space-y-6 animate-fade-in">
      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
          {successMsg}
        </div>
      )}

      <section className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Artifact Feedback</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <select value={feedbackArtifactId} onChange={(event) => setFeedbackArtifactId(event.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground">
            {artifacts.map((artifact) => (
              <option key={artifact.id} value={artifact.id}>
                {artifact.artifact_type} v{artifact.version_no}
              </option>
            ))}
          </select>
          <select value={rating} onChange={(event) => setRating(event.target.value as ArtifactFeedbackRating)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground">
            <option value="GOOD">Good</option>
            <option value="NEEDS_REVISION">Needs Revision</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <label className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground">
            <input type="checkbox" checked={goldenCandidate} onChange={(event) => setGoldenCandidate(event.target.checked)} />
            Golden example candidate
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {ISSUE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
              <input type="checkbox" checked={issues.includes(option.value)} onChange={() => handleIssueToggle(option.value)} />
              {option.label}
            </label>
          ))}
        </div>

        <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} placeholder="Feedback notes" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />

        <button onClick={handleSaveFeedback} disabled={saving || !feedbackArtifactId} className="px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Feedback
        </button>

        {feedbackHistory.length > 0 && (
          <div className="border border-border rounded-lg divide-y divide-border">
            {feedbackHistory.slice(0, 6).map((entry) => (
              <div key={entry.id} className="px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">{entry.rating}</span>
                  <span className="text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                </div>
                <p className="text-muted-foreground mt-1">
                  {entry.issue_categories.length > 0 ? entry.issue_categories.join(", ") : "No issue category"}
                  {entry.is_golden_candidate ? " | Golden candidate" : ""}
                </p>
                {entry.comment && <p className="text-foreground mt-1">{entry.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Generated vs Final Diff</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <select value={generatedArtifactId} onChange={(event) => setGeneratedArtifactId(event.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground">
            <option value="">Generated artifact</option>
            {generatedArtifacts.map((artifact) => (
              <option key={artifact.id} value={artifact.id}>TESTCASE_SET v{artifact.version_no}</option>
            ))}
          </select>
          <select value={finalArtifactId} onChange={(event) => setFinalArtifactId(event.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground">
            <option value="">Final artifact</option>
            {finalArtifacts.map((artifact) => (
              <option key={artifact.id} value={artifact.id}>TESTCASE_FINAL v{artifact.version_no}</option>
            ))}
          </select>
          <button onClick={handleLoadDiff} disabled={!generatedArtifactId || !finalArtifactId} className="px-3.5 py-2 bg-secondary border border-border rounded-lg text-xs font-semibold text-foreground disabled:opacity-50">
            Load Diff
          </button>
        </div>

        {diff && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Added" value={diff.summary.addedCount} />
            <Metric label="Removed" value={diff.summary.removedCount} />
            <Metric label="Modified" value={diff.summary.modifiedCount} />
            <Metric label="Edited Fields" value={diff.summary.editedFieldCount} />
          </div>
        )}

        {diff && diff.modified.length > 0 && (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full min-w-[720px] text-xs">
              <thead className="bg-secondary text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Test Case</th>
                  <th className="text-left px-3 py-2">Changed Fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {diff.modified.map((item) => (
                  <tr key={item.testCaseCode}>
                    <td className="px-3 py-2 font-semibold text-foreground">{item.testCaseCode}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.changes.map((change) => change.field).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Evaluation Dashboard</h3>
        </div>
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Feedback" value={metrics.totalFeedback} />
            <Metric label="Good" value={metrics.goodCount} />
            <Metric label="Needs Revision" value={metrics.needsRevisionCount} />
            <Metric label="Rejected" value={metrics.rejectedCount} />
            <Metric label="Golden Candidates" value={metrics.goldenCandidateCount} />
            <Metric label="Evaluation Runs" value={metrics.evaluationRunCount} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={modelAId} onChange={(event) => setModelAId(event.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground" />
          <input value={modelBId} onChange={(event) => setModelBId(event.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground" />
          <button onClick={handleCreateComparison} disabled={!generatedArtifactId || !finalArtifactId || saving} className="px-3.5 py-2 bg-secondary border border-border rounded-lg text-xs font-semibold text-foreground disabled:opacity-50">
            Save Comparison Snapshot
          </button>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Golden Example Workflow</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Mark a final artifact as a golden candidate, then copy a redacted JSON sample from the artifact into qa-core/examples/approved/ through a normal Git review.
        </p>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-lg bg-secondary px-3 py-2">
      <div className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  )
}

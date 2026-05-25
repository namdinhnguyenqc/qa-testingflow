"use client"

import { useCallback, useEffect, useState } from "react"
import { Clock3, FileJson, Loader2, ServerCog, AlertTriangle } from "lucide-react"
import { getFeatureHistoryAction } from "@/app/actions"
import { Artifact } from "@/domain/artifacts/types"
import { StepRun } from "@/domain/workflow-runs/types"

interface HistoryPanelProps {
  featureId: string
}

export function HistoryPanel({ featureId }: HistoryPanelProps) {
  const [stepRuns, setStepRuns] = useState<StepRun[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setErrorMsg(null)
    try {
      const result = await getFeatureHistoryAction(featureId)
      if (result.error) throw new Error(result.error)
      setStepRuns(result.data?.stepRuns || [])
      setArtifacts(result.data?.artifacts || [])
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [featureId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ServerCog className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step Runs</h3>
            <span className="text-xs text-muted-foreground">({stepRuns.length})</span>
          </div>

          <div className="divide-y divide-border">
            {stepRuns.length === 0 ? (
              <p className="px-5 py-8 text-xs text-muted-foreground">No AI step runs yet.</p>
            ) : (
              stepRuns.map((run) => (
                <div key={run.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock3 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">{run.step_key}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">
                      {run.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <span>Model: {run.model_id}</span>
                    <span>Validation: {run.validation_status}</span>
                    <span>Repairs: {run.repair_attempts}</span>
                    <span>{new Date(run.created_at).toLocaleString()}</span>
                  </div>
                  {run.error_summary && (
                    <p className="text-[11px] text-destructive leading-relaxed">{run.error_summary}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FileJson className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Artifacts</h3>
            <span className="text-xs text-muted-foreground">({artifacts.length})</span>
          </div>

          <div className="divide-y divide-border">
            {artifacts.length === 0 ? (
              <p className="px-5 py-8 text-xs text-muted-foreground">No artifacts generated yet.</p>
            ) : (
              artifacts.map((artifact) => (
                <div key={artifact.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground">{artifact.artifact_type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">
                      v{artifact.version_no} - {artifact.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <span>Schema: {artifact.schema_key}</span>
                    <span>{new Date(artifact.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

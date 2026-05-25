"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Loader2, Sparkles, Cpu, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react"
import { runRequirementAnalysisAction, getLatestArtifactByTypeAction } from "@/app/actions"
import { Feature } from "@/domain/features/types"
import { Artifact } from "@/domain/artifacts/types"

interface AnalysisPanelProps {
  projectId: string
  feature: Feature
  onRefresh: () => void
}

export function AnalysisPanel({ projectId, feature, onRefresh }: AnalysisPanelProps) {
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("gpt-4o")

  const fetchArtifact = useCallback(async () => {
    setErrorMsg(null)
    const result = await getLatestArtifactByTypeAction(feature.id, "REQUIREMENT_ANALYSIS")
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setArtifact(result.data || null)
    }
    setLoading(false)
  }, [feature.id])

  useEffect(() => {
    fetchArtifact()
  }, [fetchArtifact])

  const handleRunAnalysis = async () => {
    setRunning(true)
    setErrorMsg(null)
    try {
      const result = await runRequirementAnalysisAction(projectId, feature.id, selectedModel)
      if (result.error) throw new Error(result.error)
      await fetchArtifact()
      onRefresh()
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-card border border-border rounded-xl">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const content = artifact?.content_json

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Control Bar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
            Requirement Reader & Analysis
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Phân tích tài liệu đầu vào bằng AI để phát hiện Facts, Missing Rules, Conflicts và Assumptions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Select Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={running}
              className="bg-secondary border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary transition-colors text-foreground font-medium"
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="codex-model">Codex Engine</option>
            </select>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={running}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/30 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
          >
            {running ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-primary-foreground/10" />
                {artifact ? "Rerun Analysis" : "Run Analysis"}
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* 2. Analysis Content View */}
      {!content ? (
        <div className="flex flex-col items-center justify-center p-16 border border-border border-dashed rounded-xl bg-card text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Sẵn sàng phân tích kịch bản</h4>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Click nút **Run Analysis** phía trên để AI đóng vai trò Senior QA Analyst phân tích toàn diện các tài liệu nghiệp vụ đã đính kèm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái: Facts & Flow */}
          <div className="md:col-span-2 space-y-6">
            {/* Goal Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feature Goal</h4>
              <p className="text-sm leading-relaxed text-foreground font-medium">{content.feature_goal}</p>
            </div>

            {/* Actors & Preconditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actors / Roles</h4>
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {content.actors?.map((actor: any, idx: number) => (
                    <div key={idx} className="text-xs leading-relaxed">
                      <span className="font-semibold text-primary">{actor.role}</span>:{" "}
                      <span className="text-muted-foreground">{actor.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preconditions</h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-muted-foreground max-h-[160px] overflow-y-auto pr-1">
                  {content.preconditions?.map((pre: string, idx: number) => (
                    <li key={idx}>{pre}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Flows & Steps */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Main & Alternative Flows</h4>
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {content.flows?.map((flow: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {flow.name}
                    </span>
                    <ol className="list-decimal pl-5 space-y-1 text-xs text-muted-foreground">
                      {flow.steps?.map((step: string, sIdx: number) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Gaps, Assumptions, Conflicts */}
          <div className="md:col-span-1 space-y-6">
            {/* Critical Gaps (Chặn E2E / Official test case) */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Critical Missing Gaps ({content.missing_critical?.length || 0})
              </h4>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {content.missing_critical?.length === 0 ? (
                  <p className="text-xs text-emerald-400 font-medium">No critical gaps discovered! Clean baseline.</p>
                ) : (
                  content.missing_critical?.map((g: any, idx: number) => (
                    <div key={idx} className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg space-y-1 text-xs">
                      <div className="font-semibold text-red-400">{g.rule_key.replace(/_/g, " ").toUpperCase()}</div>
                      <div className="text-muted-foreground leading-relaxed">{g.description}</div>
                      <div className="text-[10px] text-red-500/60 font-medium">Why block: {g.reason_critical}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Conflicts & Assumptions */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Assumptions & Conflicts
              </h4>
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {/* Conflicts */}
                {content.conflicts?.map((c: any, idx: number) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <span className="font-semibold text-amber-500 flex items-center gap-1">
                      Conflict: {c.sources?.join(" vs ")}
                    </span>
                    <p className="text-muted-foreground leading-relaxed">{c.description}</p>
                  </div>
                ))}

                {/* Assumptions */}
                {content.assumptions?.map((a: any, idx: number) => (
                  <div key={idx} className="space-y-1 text-xs border-t border-border/40 pt-2.5 first:border-0 first:pt-0">
                    <span className="font-semibold text-zinc-400">Assumption #{idx + 1}</span>
                    <p className="text-muted-foreground leading-relaxed">{a.description}</p>
                    <span className="text-[10px] text-muted-foreground/60 italic block">Reason: {a.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Loader2, Sparkles, AlertTriangle, ArrowRight, CornerDownRight } from "lucide-react"
import { getLatestArtifactByTypeAction, confirmUnderstandingAction } from "@/app/actions"
import { Feature } from "@/domain/features/types"
import { Artifact } from "@/domain/artifacts/types"

interface UnderstandingPanelProps {
  projectId: string
  feature: Feature
  onRefresh: () => void
}

export function UnderstandingPanel({ projectId, feature, onRefresh }: UnderstandingPanelProps) {
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchArtifact = async () => {
    setErrorMsg(null)
    const result = await getLatestArtifactByTypeAction(feature.id, "FEATURE_UNDERSTANDING")
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setArtifact(result.data || null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchArtifact()
  }, [feature.id])

  const handleConfirm = async () => {
    if (!artifact) return
    setConfirming(true)
    setErrorMsg(null)
    try {
      const result = await confirmUnderstandingAction(artifact.id, feature.id, projectId)
      if (result.error) throw new Error(result.error)
      await fetchArtifact()
      onRefresh()
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setConfirming(false)
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
  const isConfirmed = artifact?.status === "CONFIRMED" || feature.status === "UNDERSTANDING_CONFIRMED" || feature.status === "TESTCASE_GENERATING" || feature.status === "TESTCASE_DRAFTED" || feature.status === "COMPLETED"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info Bar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            Feature Understanding Summary
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Bản tóm tắt toàn bộ yêu cầu nghiệp vụ, luồng xử lý và validations của tính năng đã được thống nhất.
          </p>
        </div>

        {artifact && !isConfirmed && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-emerald-800/40 disabled:text-zinc-500 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0"
          >
            {confirming ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                Confirm Understanding
              </>
            )}
          </button>
        )}

        {isConfirmed && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Understanding Confirmed</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Content */}
      {!content ? (
        <div className="flex flex-col items-center justify-center p-16 border border-border border-dashed rounded-xl bg-card text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Chờ thống nhất nghiệp vụ</h4>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Bản hiểu biết tính năng (Feature Understanding) sẽ tự động được AI sinh ra sau khi hoàn tất bước trả lời câu hỏi làm rõ (Clarification).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái: Goal & Flows */}
          <div className="md:col-span-2 space-y-6">
            {/* Goal Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Business Goal</h4>
              <p className="text-sm leading-relaxed text-foreground font-medium">{content.goal}</p>
            </div>

            {/* Flows & Steps */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirmed User Flows</h4>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {content.flows?.map((flow: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

            {/* State Transitions */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State Transitions</h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {content.state_transitions?.map((trans: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-foreground font-medium py-1 first:pt-0 border-b border-border/20 last:border-0">
                    <span className="px-2 py-0.5 rounded bg-secondary border border-border font-semibold text-[10px] uppercase text-muted-foreground">{trans.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    <span className="px-2 py-0.5 rounded bg-secondary border border-border font-semibold text-[10px] uppercase text-muted-foreground">{trans.to}</span>
                    <span className="text-muted-foreground text-[10px] italic pl-2">Trigger: {trans.trigger}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Rules & Validations */}
          <div className="md:col-span-1 space-y-6">
            {/* Confirmed Business Rules */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Confirmed Business Rules
              </h4>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {content.confirmed_business_rules?.map((rule: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <CornerDownRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmed Validations */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirmed Validations</h4>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {content.confirmed_validations?.map((val: any, idx: number) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <span className="font-semibold text-primary">{val.field}</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {val.rules?.map((r: string, rIdx: number) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Handlings & Assumptions */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Error Handling & Assumptions</h4>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 text-xs">
                {content.error_handling_rules?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-red-400">Error Handlings:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {content.error_handling_rules?.map((rule: string, rIdx: number) => (
                        <li key={rIdx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {content.remaining_non_critical_assumptions?.length > 0 && (
                  <div className="space-y-1.5 border-t border-border/40 pt-2.5">
                    <span className="font-semibold text-zinc-400">Non-critical Assumptions:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {content.remaining_non_critical_assumptions?.map((asm: string, aIdx: number) => (
                        <li key={aIdx}>{asm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

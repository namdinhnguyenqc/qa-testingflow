"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Cpu, Loader2, Lock, ShieldCheck, Sparkles, MessageSquare, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { InputSourceManager } from "@/components/features/input-source-manager"
import { AnalysisPanel } from "@/components/features/analysis-panel"
import { ClarificationPanel } from "@/components/features/clarification-panel"
import { UnderstandingPanel } from "@/components/features/understanding-panel"
import { TestCasePanel } from "@/components/features/testcase-panel"
import { getFeatureByIdAction, getProjectByIdAction, getInputSourcesAction } from "@/app/actions"
import { Project } from "@/domain/projects/types"
import { Feature } from "@/domain/features/types"
import { InputSource } from "@/domain/inputs/types"
import { cn } from "@/lib/utils"

export default function FeatureWorkspace() {
  const { projectId, featureId } = useParams() as { projectId: string; featureId: string }
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [feature, setFeature] = useState<Feature | null>(null)
  const [sources, setSources] = useState<InputSource[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"inputs" | "analysis" | "clarification" | "understanding" | "testcases" | "history">("inputs")

  const fetchData = async () => {
    setErrorMsg(null)
    try {
      const featResult = await getFeatureByIdAction(featureId)
      if (featResult.error) throw new Error(featResult.error)
      if (!featResult.data) throw new Error("Feature workspace not found")

      setFeature(featResult.data)

      const projResult = await getProjectByIdAction(projectId)
      if (projResult.error) throw new Error(projResult.error)
      setProject(projResult.data ?? null)

      const srcResult = await getInputSourcesAction(featureId)
      if (srcResult.error) throw new Error(srcResult.error)
      setSources(srcResult.data || [])
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load workspace data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [featureId, projectId])

  // Tự động chuyển tab dựa trên status của feature (chỉ hỗ trợ chuyển hướng ban đầu để trải nghiệm mượt)
  useEffect(() => {
    if (!feature) return
    const status = feature.status
    if (status === "DRAFT" || status === "INPUT_READY") {
      setActiveTab("inputs")
    } else if (status === "ANALYZING") {
      setActiveTab("analysis")
    } else if (status === "NEEDS_CLARIFICATION") {
      setActiveTab("clarification")
    } else if (status === "READY_FOR_UNDERSTANDING" || status === "UNDERSTANDING_REVIEW") {
      setActiveTab("understanding")
    } else if (status === "UNDERSTANDING_CONFIRMED" || status === "TESTCASE_GENERATING" || status === "TESTCASE_DRAFTED" || status === "COMPLETED") {
      setActiveTab("testcases")
    }
  }, [feature?.status])

  const getStatusStyle = (status?: Feature["status"]) => {
    if (!status) return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
    const styles: Record<Feature["status"], string> = {
      DRAFT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      INPUT_READY: "bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse",
      ANALYZING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      NEEDS_CLARIFICATION: "bg-red-500/10 text-red-400 border-red-500/20",
      READY_FOR_UNDERSTANDING: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      UNDERSTANDING_REVIEW: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      UNDERSTANDING_CONFIRMED: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      TESTCASE_GENERATING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      TESTCASE_DRAFTED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
    }
    return styles[status]
  }

  const getStatusLabel = (status?: Feature["status"]) => {
    if (!status) return "Draft"
    const labels: Record<Feature["status"], string> = {
      DRAFT: "Draft",
      INPUT_READY: "Ready to Analyze",
      ANALYZING: "Analyzing",
      NEEDS_CLARIFICATION: "Action Required",
      READY_FOR_UNDERSTANDING: "Ready for Summary",
      UNDERSTANDING_REVIEW: "Review Understanding",
      UNDERSTANDING_CONFIRMED: "Ready for Test Cases",
      TESTCASE_GENERATING: "Generating Test Cases",
      TESTCASE_DRAFTED: "Review Test Cases",
      COMPLETED: "Completed",
      FAILED: "Failed",
    }
    return labels[status]
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg || !feature || !project) {
    return (
      <div className="flex h-screen w-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 p-8 space-y-4">
            <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Project Detail
            </Link>
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
              {errorMsg || "Workspace not found"}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Cấu hình trạng thái sáng/mờ của các steps trong Stepper dựa trên Feature status thực tế
  const status = feature.status
  const steps = [
    { key: "inputs", label: "Inputs", active: true },
    { key: "analysis", label: "Analysis", active: status !== "DRAFT" && status !== "INPUT_READY" },
    { key: "clarification", label: "Clarification", active: status === "NEEDS_CLARIFICATION" || status === "READY_FOR_UNDERSTANDING" || status === "UNDERSTANDING_REVIEW" || status === "UNDERSTANDING_CONFIRMED" || status === "TESTCASE_GENERATING" || status === "TESTCASE_DRAFTED" || status === "COMPLETED" },
    { key: "understanding", label: "Understanding", active: status === "READY_FOR_UNDERSTANDING" || status === "UNDERSTANDING_REVIEW" || status === "UNDERSTANDING_CONFIRMED" || status === "TESTCASE_GENERATING" || status === "TESTCASE_DRAFTED" || status === "COMPLETED" },
    { key: "testcases", label: "Test Cases", active: status === "UNDERSTANDING_CONFIRMED" || status === "TESTCASE_GENERATING" || status === "TESTCASE_DRAFTED" || status === "COMPLETED" },
    { key: "export", label: "Export", active: status === "COMPLETED" },
  ]

  // === Mở khóa tab dựa trên tiến độ thực tế ===
  const isInputsReady = status !== "DRAFT"
  const isAnalysisUnlocked = status !== "DRAFT" && status !== "INPUT_READY"
  const isClarificationUnlocked = status === "NEEDS_CLARIFICATION" || status === "READY_FOR_UNDERSTANDING" || status === "UNDERSTANDING_REVIEW" || status === "UNDERSTANDING_CONFIRMED" || status === "TESTCASE_GENERATING" || status === "TESTCASE_DRAFTED" || status === "COMPLETED"
  const isUnderstandingUnlocked = status === "READY_FOR_UNDERSTANDING" || status === "UNDERSTANDING_REVIEW" || status === "UNDERSTANDING_CONFIRMED" || status === "TESTCASE_GENERATING" || status === "TESTCASE_DRAFTED" || status === "COMPLETED"
  const isTestCasesUnlocked = status === "UNDERSTANDING_CONFIRMED" || status === "TESTCASE_GENERATING" || status === "TESTCASE_DRAFTED" || status === "COMPLETED"

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header breadcrumbs={[
          { label: "Projects", href: "/" },
          { label: project.name, href: `/projects/${projectId}` },
          { label: feature.name }
        ]} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Back to Project */}
          <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Detail
          </Link>

          {/* Feature Header Banner */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-foreground tracking-tight">{feature.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(feature.status)}`}>
                  {getStatusLabel(feature.status)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl">
                {feature.description || "No description provided for this feature."}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-lg bg-secondary border border-border">
                <Cpu className="w-4 h-4 text-primary" />
                <span>Engine: {feature.selected_model_id || "gpt-4o"}</span>
              </div>
            </div>
          </div>

          {/* Stepper progress indicator */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all",
                      step.active
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-secondary border-border text-muted-foreground opacity-35"
                    )}>
                      {index + 1}
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold mt-1",
                      step.active ? "text-foreground" : "text-muted-foreground opacity-30"
                    )}>{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 mx-4 rounded-full",
                      step.active ? "bg-primary" : "bg-border opacity-20"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tabs Container */}
          <div className="space-y-4">
            {/* Tabs Trigger Navigation */}
            <div className="flex border-b border-border text-sm font-medium overflow-x-auto">
              {/* Inputs */}
              <button
                onClick={() => setActiveTab("inputs")}
                className={cn(
                  "px-4 py-2 border-b-2 transition-all font-semibold cursor-pointer shrink-0",
                  activeTab === "inputs"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Inputs Intake
              </button>
              
              {/* Analysis */}
              {isAnalysisUnlocked ? (
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={cn(
                    "px-4 py-2 border-b-2 transition-all font-semibold cursor-pointer shrink-0 flex items-center gap-1.5",
                    activeTab === "analysis"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Analysis
                </button>
              ) : (
                <span className="px-4 py-2 border-b-2 border-transparent text-muted-foreground/35 flex items-center gap-1.5 cursor-not-allowed select-none shrink-0" title="Need Inputs attached first">
                  Analysis
                  <Lock className="w-3 h-3" />
                </span>
              )}

              {/* Clarification */}
              {isClarificationUnlocked ? (
                <button
                  onClick={() => setActiveTab("clarification")}
                  className={cn(
                    "px-4 py-2 border-b-2 transition-all font-semibold cursor-pointer shrink-0 flex items-center gap-1.5",
                    activeTab === "clarification"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  Clarification
                </button>
              ) : (
                <span className="px-4 py-2 border-b-2 border-transparent text-muted-foreground/35 flex items-center gap-1.5 cursor-not-allowed select-none shrink-0" title="Locked until gaps discovered">
                  Clarification
                  <Lock className="w-3 h-3" />
                </span>
              )}

              {/* Understanding */}
              {isUnderstandingUnlocked ? (
                <button
                  onClick={() => setActiveTab("understanding")}
                  className={cn(
                    "px-4 py-2 border-b-2 transition-all font-semibold cursor-pointer shrink-0 flex items-center gap-1.5",
                    activeTab === "understanding"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Understanding
                </button>
              ) : (
                <span className="px-4 py-2 border-b-2 border-transparent text-muted-foreground/35 flex items-center gap-1.5 cursor-not-allowed select-none shrink-0" title="Locked until gaps resolved">
                  Understanding
                  <Lock className="w-3 h-3" />
                </span>
              )}

              {/* Test Cases */}
              {isTestCasesUnlocked ? (
                <button
                  onClick={() => setActiveTab("testcases")}
                  className={cn(
                    "px-4 py-2 border-b-2 transition-all font-semibold cursor-pointer shrink-0 flex items-center gap-1.5",
                    activeTab === "testcases"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                  Test Cases
                </button>
              ) : (
                <span className="px-4 py-2 border-b-2 border-transparent text-muted-foreground/35 flex items-center gap-1.5 cursor-not-allowed select-none shrink-0" title="Locked until understanding confirmed">
                  Test Cases
                  <Lock className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Tab Panels */}
            {activeTab === "inputs" && (
              <InputSourceManager
                projectId={projectId}
                featureId={featureId}
                initialSources={sources}
                onRefresh={fetchData}
              />
            )}

            {activeTab === "analysis" && (
              <AnalysisPanel
                projectId={projectId}
                feature={feature}
                onRefresh={fetchData}
              />
            )}

            {activeTab === "clarification" && (
              <ClarificationPanel
                projectId={projectId}
                feature={feature}
                onRefresh={fetchData}
              />
            )}

            {activeTab === "understanding" && (
              <UnderstandingPanel
                projectId={projectId}
                feature={feature}
                onRefresh={fetchData}
              />
            )}

            {activeTab === "testcases" && (
              <TestCasePanel
                projectId={projectId}
                feature={feature}
                onRefresh={fetchData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

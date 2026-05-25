"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, Edit, Trash2, ArrowLeft, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { FeatureTable } from "@/components/features/feature-table"
import { FeatureForm } from "@/components/features/feature-form"
import { ProjectForm } from "@/components/features/project-form"
import { getProjectByIdAction, getFeaturesByProjectIdAction, deleteProjectAction } from "@/app/actions"
import { Project } from "@/domain/projects/types"
import { Feature } from "@/domain/features/types"

export default function ProjectDetail() {
  const { projectId } = useParams() as { projectId: string }
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [isNewFeatureOpen, setIsNewFeatureOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const projResult = await getProjectByIdAction(projectId)
      if (projResult.error) throw new Error(projResult.error)
      if (!projResult.data) throw new Error("Project not found")

      setProject(projResult.data)

      const featResult = await getFeaturesByProjectIdAction(projectId)
      if (featResult.error) throw new Error(featResult.error)

      setFeatures(featResult.data || [])
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load project details")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteProject = async () => {
    if (confirm("Are you sure you want to delete this Project? ALL feature workspaces and attachments inside will be lost forever.")) {
      const result = await deleteProjectAction(projectId)
      if (result.success) {
        router.push("/")
      } else {
        alert(`Delete failed: ${result.error}`)
      }
    }
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

  if (errorMsg || !project) {
    return (
      <div className="flex h-screen w-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 p-8 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
              {errorMsg || "Project not found"}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header breadcrumbs={[{ label: "Projects", href: "/" }, { label: project.name }]} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Back to Dashboard */}
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>

          {/* Project Banner Info */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground tracking-tight">{project.name}</h1>
                <div className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border uppercase">
                  Default AI: {project.default_model_id || "gpt-4o"}
                </div>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {project.description || "No description provided for this project. Customize details using Edit Project."}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <button
                onClick={() => setIsEditProjectOpen(true)}
                className="px-3.5 py-2 border border-border hover:bg-secondary text-foreground rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Project
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-3.5 py-2 border border-destructive/20 hover:bg-destructive/10 text-destructive rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Project
              </button>
            </div>
          </div>

          {/* Features area header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Feature Workspaces</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các workspace thiết kế kịch bản test cho từng tính năng của dự án.
              </p>
            </div>
            <button
              onClick={() => setIsNewFeatureOpen(true)}
              className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Feature
            </button>
          </div>

          {/* Features Table */}
          <FeatureTable
            projectId={projectId}
            features={features}
            onRefresh={fetchData}
          />
        </main>
      </div>

      {isEditProjectOpen && (
        <ProjectForm
          project={project}
          onSuccess={fetchData}
          open={isEditProjectOpen}
          onOpenChange={setIsEditProjectOpen}
        />
      )}

      {isNewFeatureOpen && (
        <FeatureForm
          projectId={projectId}
          onSuccess={fetchData}
          open={isNewFeatureOpen}
          onOpenChange={setIsNewFeatureOpen}
        />
      )}
    </div>
  )
}

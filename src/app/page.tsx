"use client"

import { useEffect, useState } from "react"
import { FolderKanban, Plus, Layers, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ProjectForm } from "@/components/features/project-form"
import { getProjectsAction } from "@/app/actions"
import { Project } from "@/domain/projects/types"
import Link from "next/link"

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const fetchProjects = async () => {
    setLoading(true)
    setErrorMsg(null)
    const result = await getProjectsAction()
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setProjects(result.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header breadcrumbs={[{ label: "Dashboard" }]} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Dashboard Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-foreground to-muted-foreground bg-clip-text">
                Dashboard Overview
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Quản lý các dự án kiểm thử QA có AI hỗ trợ theo luồng skill/version.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>

          {/* Metrics section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Total Projects</span>
                <span className="text-xl font-bold text-foreground mt-0.5 block">{projects.length}</span>
              </div>
            </div>

            {/* Placeholders for AI dashboard metrics */}
            <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm opacity-80">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">QA Features</span>
                <span className="text-xl font-bold text-foreground mt-0.5 block">0</span>
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm opacity-80">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Needs Action</span>
                <span className="text-xl font-bold text-foreground mt-0.5 block">0</span>
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm opacity-80">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Finalized Cases</span>
                <span className="text-xl font-bold text-foreground mt-0.5 block">0</span>
              </div>
            </div>
          </div>

          {/* Project List / Area */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">All Managed Projects</h2>
            
            {loading ? (
              <div className="flex items-center justify-center p-12 bg-card border border-border rounded-xl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : errorMsg ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                Failed to load projects: {errorMsg}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 border border-border border-dashed rounded-xl bg-card text-center space-y-4 max-w-xl mx-auto mt-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FolderKanban className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Welcome to QAFlow AI</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Hãy bắt đầu bằng cách tạo dự án kiểm thử đầu tiên để quản lý tài liệu, chạy phân tích và tự động hóa các kịch bản test.
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                >
                  Create Project First
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        <div className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border uppercase">
                          {project.default_model_id || "gpt-4o"}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[2rem]">
                        {project.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border mt-4 pt-4 text-xs">
                      <span className="text-muted-foreground">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        Open Project
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {isCreateOpen && (
        <ProjectForm
          onSuccess={fetchProjects}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      )}
    </div>
  )
}

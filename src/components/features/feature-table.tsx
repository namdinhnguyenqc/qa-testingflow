"use client"

import Link from "next/link"
import { useState } from "react"
import { Play, Edit, Trash2, ArrowUpRight, Cpu } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Feature } from "@/domain/features/types"
import { FeatureForm } from "./feature-form"
import { deleteFeatureAction } from "@/app/actions"

interface FeatureTableProps {
  projectId: string
  features: Feature[]
  onRefresh: () => void
}

export function FeatureTable({ projectId, features, onRefresh }: FeatureTableProps) {
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this Feature Workspace? All attachments will be lost.")) {
      await deleteFeatureAction(id, projectId)
      onRefresh()
    }
  }

  const getStatusStyle = (status: Feature["status"]) => {
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
    return styles[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  }

  const getStatusLabel = (status: Feature["status"]) => {
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
    return labels[status] || status
  }

  if (features.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-border border-dashed rounded-xl bg-card">
        <p className="text-muted-foreground text-sm mb-4">No features created yet in this project.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <th className="px-6 py-4">Feature Name</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Updated</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {features.map((feature) => (
            <tr key={feature.id} className="hover:bg-secondary/20 transition-colors group">
              {/* Feature Name */}
              <td className="px-6 py-4 font-semibold text-foreground">
                <Link
                  href={`/projects/${projectId}/features/${feature.id}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                >
                  {feature.name}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </Link>
                {feature.description && (
                  <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">
                    {feature.description}
                  </p>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(feature.status)}`}>
                  {getStatusLabel(feature.status)}
                </span>
              </td>

              {/* Updated At */}
              <td className="px-6 py-4 text-muted-foreground text-xs font-normal">
                {formatDate(feature.updated_at)}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/projects/${projectId}/features/${feature.id}`}
                    className="p-1.5 rounded-lg hover:bg-secondary text-primary hover:text-primary/80 transition-colors"
                    title="Enter Workspace"
                  >
                    <Play className="w-4 h-4 fill-primary/10" />
                  </Link>
                  <button
                    onClick={() => setEditingFeature(feature)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Feature"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(feature.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-destructive hover:text-destructive/80 transition-colors"
                    title="Delete Feature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingFeature && (
        <FeatureForm
          projectId={projectId}
          feature={editingFeature}
          onSuccess={onRefresh}
          open={!!editingFeature}
          onOpenChange={(open) => !open && setEditingFeature(null)}
        />
      )}
    </div>
  )
}

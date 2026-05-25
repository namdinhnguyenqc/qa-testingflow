"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { createProjectAction, updateProjectAction } from "@/app/actions"
import { Project } from "@/domain/projects/types"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: Project
  onSuccess: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectForm({ project, onSuccess, open, onOpenChange }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
    },
  })

  const onSubmit = async (values: ProjectFormValues) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      if (project) {
        const result = await updateProjectAction(project.id, values)
        if (result.error) throw new Error(result.error)
      } else {
        const result = await createProjectAction(values)
        if (result.error) throw new Error(result.error)
      }
      onSuccess()
      reset()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-2xl z-50 animate-scale-up">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {project ? "Edit Project" : "Create New Project"}
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Project Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. Booking System API, E-Commerce Suite..."
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Provide a brief context or description of this project..."
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>



            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
              <Dialog.Close type="button" className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {project ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

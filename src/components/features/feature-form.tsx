"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { createFeatureAction, updateFeatureAction } from "@/app/actions"
import { Feature } from "@/domain/features/types"

const featureSchema = z.object({
  name: z.string().min(1, "Feature name is required").max(100, "Feature name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  workflow_key: z.string().default("manual_test_design"),
  selected_model_id: z.string().default("gpt-4o"),
})

type FeatureFormValues = z.infer<typeof featureSchema>

interface FeatureFormProps {
  projectId: string
  feature?: Feature
  onSuccess: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeatureForm({ projectId, feature, onSuccess, open, onOpenChange }: FeatureFormProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: feature?.name || "",
      description: feature?.description || "",
      workflow_key: feature?.workflow_key || "manual_test_design",
      selected_model_id: feature?.selected_model_id || "gpt-4o",
    },
  })

  const onSubmit = async (values: FeatureFormValues) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      if (feature) {
        const result = await updateFeatureAction(feature.id, values, projectId)
        if (result.error) throw new Error(result.error)
      } else {
        const result = await createFeatureAction({
          ...values,
          project_id: projectId,
        })
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
              {feature ? "Edit Feature Workspace" : "New Feature Workspace"}
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
            {/* Feature Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Feature Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. User Authentication Flow, Stripe Billing Gate..."
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
                placeholder="Provide details about what needs to be tested in this feature..."
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            {/* Workflow Key */}
            <div className="space-y-1.5">
              <label htmlFor="workflow_key" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Workflow
              </label>
              <select
                id="workflow_key"
                {...register("workflow_key")}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="manual_test_design">Manual Test Design Workflow (Standard MVP)</option>
              </select>
            </div>

            {/* Model Key */}
            <div className="space-y-1.5">
              <label htmlFor="selected_model_id" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select AI Engine Model Configuration
              </label>
              <select
                id="selected_model_id"
                {...register("selected_model_id")}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="codex-model">Codex Model (OpenAI-compatible)</option>
              </select>
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
                {feature ? "Save Changes" : "Start Feature Workspace"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

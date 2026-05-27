"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Compass, Globe2, Loader2, Play, ShieldCheck } from "lucide-react"
import {
  createFeatureEnvironmentAction,
  enqueueUiExplorationJobAction,
  getFeatureEnvironmentsAction,
  getUiExplorationJobsAction,
} from "@/app/actions"
import { FeatureEnvironment, UiExplorationJob } from "@/domain/ui-exploration/types"

interface UiExplorationPanelProps {
  projectId: string
  featureId: string
}

export function UiExplorationPanel({ projectId, featureId }: UiExplorationPanelProps) {
  const [environments, setEnvironments] = useState<FeatureEnvironment[]>([])
  const [jobs, setJobs] = useState<UiExplorationJob[]>([])
  const [name, setName] = useState("Staging")
  const [baseUrl, setBaseUrl] = useState("")
  const [allowedDomains, setAllowedDomains] = useState("")
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setErrorMsg(null)
    try {
      const [environmentResult, jobResult] = await Promise.all([
        getFeatureEnvironmentsAction(featureId),
        getUiExplorationJobsAction(featureId),
      ])
      if (environmentResult.error) throw new Error(environmentResult.error)
      if (jobResult.error) throw new Error(jobResult.error)

      const loadedEnvironments = environmentResult.data || []
      setEnvironments(loadedEnvironments)
      setJobs(jobResult.data || [])

      if (!selectedEnvironmentId && loadedEnvironments[0]) {
        setSelectedEnvironmentId(loadedEnvironments[0].id)
        setTargetUrl(loadedEnvironments[0].base_url)
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load UI exploration data")
    } finally {
      setLoading(false)
    }
  }, [featureId, selectedEnvironmentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateEnvironment = async () => {
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const result = await createFeatureEnvironmentAction(
        {
          feature_id: featureId,
          name,
          base_url: baseUrl,
          allowed_domains: allowedDomains.split(",").map((domain) => domain.trim()).filter(Boolean),
        },
        projectId
      )
      if (result.error) throw new Error(result.error)
      setSuccessMsg("Environment saved.")
      setBaseUrl("")
      setAllowedDomains("")
      await loadData()
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to save environment")
    } finally {
      setSaving(false)
    }
  }

  const handleEnqueueJob = async () => {
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const result = await enqueueUiExplorationJobAction({
        featureId,
        projectId,
        environmentId: selectedEnvironmentId,
        targetUrl,
      })
      if (result.error) throw new Error(result.error)
      setSuccessMsg("UI exploration job queued for worker.")
      await loadData()
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to enqueue UI exploration job")
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
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Authorized Environment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={name} onChange={(event) => setName(event.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground" />
          <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://staging.example.com" className="md:col-span-2 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
          <input value={allowedDomains} onChange={(event) => setAllowedDomains(event.target.value)} placeholder="staging.example.com" className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
        </div>
        <button onClick={handleCreateEnvironment} disabled={saving || !baseUrl} className="px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-50">
          Save Environment
        </button>
      </section>

      <section className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Explore UI Job</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={selectedEnvironmentId} onChange={(event) => setSelectedEnvironmentId(event.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground">
            <option value="">Select environment</option>
            {environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name} - {environment.base_url}
              </option>
            ))}
          </select>
          <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="Target URL" className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
          <button onClick={handleEnqueueJob} disabled={saving || !selectedEnvironmentId || !targetUrl} className="px-3.5 py-2 bg-secondary border border-border text-foreground rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Queue Worker Job
          </button>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Exploration Jobs</h3>
        </div>
        <div className="divide-y divide-border border border-border rounded-lg">
          {jobs.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted-foreground">No UI exploration jobs queued yet.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="px-4 py-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground truncate">{job.target_url}</span>
                  <span className="px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">{job.status}</span>
                </div>
                <p className="text-muted-foreground">{job.progress_message || "Waiting for worker."}</p>
                {job.error_summary && <p className="text-destructive">{job.error_summary}</p>}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

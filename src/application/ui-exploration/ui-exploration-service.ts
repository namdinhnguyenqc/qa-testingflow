import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import {
  CreateFeatureEnvironmentDTO,
  FeatureEnvironment,
  UiExplorationJob,
} from "@/domain/ui-exploration/types"

export class UiExplorationService {
  private dbAdapter: SupabaseDbAdapter

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
  }

  async createEnvironment(dto: CreateFeatureEnvironmentDTO): Promise<FeatureEnvironment> {
    const baseUrl = parseHttpUrl(dto.base_url)
    const allowedDomains = normalizeAllowedDomains(dto.allowed_domains.length > 0 ? dto.allowed_domains : [baseUrl.hostname])

    if (!isHostAllowed(baseUrl.hostname, allowedDomains)) {
      throw new Error("Environment base URL must belong to the allowed domain list.")
    }

    return this.dbAdapter.createFeatureEnvironment({
      ...dto,
      base_url: baseUrl.toString(),
      allowed_domains: allowedDomains,
    })
  }

  async getEnvironments(featureId: string): Promise<FeatureEnvironment[]> {
    return this.dbAdapter.getFeatureEnvironments(featureId)
  }

  async enqueueExplorationJob(params: {
    featureId: string
    environmentId: string
    targetUrl: string
  }): Promise<UiExplorationJob> {
    const environment = await this.dbAdapter.getFeatureEnvironmentById(params.environmentId)
    if (!environment || environment.feature_id !== params.featureId || !environment.is_active) {
      throw new Error("Active UI exploration environment was not found for this feature.")
    }

    const targetUrl = parseHttpUrl(params.targetUrl)
    const allowedDomains = normalizeAllowedDomains(environment.allowed_domains)
    if (!isHostAllowed(targetUrl.hostname, allowedDomains)) {
      throw new Error("Target URL is outside the authorized domain allowlist.")
    }

    return this.dbAdapter.createUiExplorationJob({
      feature_id: params.featureId,
      environment_id: params.environmentId,
      target_url: targetUrl.toString(),
      allowed_domains: allowedDomains,
      status: "QUEUED",
      progress_message: "Queued for external Playwright MCP worker.",
    })
  }

  async getJobs(featureId: string): Promise<UiExplorationJob[]> {
    return this.dbAdapter.getUiExplorationJobs(featureId)
  }
}

export function normalizeAllowedDomains(domains: string[]): string[] {
  const normalized = domains
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
    .map((domain) => domain.replace(/^https?:\/\//, "").split("/")[0])

  return Array.from(new Set(normalized))
}

function parseHttpUrl(value: string): URL {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error("A valid http(s) URL is required.")
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http(s) URLs are allowed for UI exploration.")
  }

  return parsed
}

function isHostAllowed(hostname: string, allowedDomains: string[]): boolean {
  const host = hostname.toLowerCase()
  return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

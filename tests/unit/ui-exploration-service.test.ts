import { afterEach, describe, expect, it, vi } from "vitest"

async function loadServiceWithDb(dbMock: Record<string, any>) {
  vi.resetModules()
  vi.doMock("@/infrastructure/database/supabase-db-adapter", () => ({
    SupabaseDbAdapter: vi.fn().mockImplementation(() => dbMock),
  }))
  const { UiExplorationService } = await import("@/application/ui-exploration/ui-exploration-service")
  return new UiExplorationService()
}

describe("Phase 03 UI exploration service", () => {
  afterEach(() => {
    vi.doUnmock("@/infrastructure/database/supabase-db-adapter")
  })

  it("creates an environment with normalized allowed domains", async () => {
    const createFeatureEnvironment = vi.fn(async (dto) => ({
      id: "env-1",
      created_at: "2026-05-27T00:00:00.000Z",
      updated_at: "2026-05-27T00:00:00.000Z",
      is_active: true,
      ...dto,
    }))
    const service = await loadServiceWithDb({ createFeatureEnvironment })

    const environment = await service.createEnvironment({
      feature_id: "feature-1",
      base_url: "https://staging.example.com/login",
      allowed_domains: ["https://example.com/path", "staging.example.com"],
    })

    expect(environment.allowed_domains).toEqual(["example.com", "staging.example.com"])
    expect(createFeatureEnvironment).toHaveBeenCalledTimes(1)
  })

  it("blocks exploration jobs outside the environment allowlist", async () => {
    const createUiExplorationJob = vi.fn()
    const service = await loadServiceWithDb({
      getFeatureEnvironmentById: vi.fn(async () => ({
        id: "env-1",
        feature_id: "feature-1",
        base_url: "https://staging.example.com",
        allowed_domains: ["staging.example.com"],
        is_active: true,
      })),
      createUiExplorationJob,
    })

    await expect(
      service.enqueueExplorationJob({
        featureId: "feature-1",
        environmentId: "env-1",
        targetUrl: "https://evil.example.net/login",
      })
    ).rejects.toThrow("Target URL is outside the authorized domain allowlist.")

    expect(createUiExplorationJob).not.toHaveBeenCalled()
  })

  it("queues allowed exploration jobs for the external worker", async () => {
    const createUiExplorationJob = vi.fn(async (dto) => ({
      id: "job-1",
      created_at: "2026-05-27T00:00:00.000Z",
      ...dto,
    }))
    const service = await loadServiceWithDb({
      getFeatureEnvironmentById: vi.fn(async () => ({
        id: "env-1",
        feature_id: "feature-1",
        base_url: "https://staging.example.com",
        allowed_domains: ["example.com"],
        is_active: true,
      })),
      createUiExplorationJob,
    })

    const job = await service.enqueueExplorationJob({
      featureId: "feature-1",
      environmentId: "env-1",
      targetUrl: "https://staging.example.com/login",
    })

    expect(job.status).toBe("QUEUED")
    expect(job.allowed_domains).toEqual(["example.com"])
  })
})

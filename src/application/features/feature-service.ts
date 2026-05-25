import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import { Feature, CreateFeatureDTO, UpdateFeatureDTO } from "@/domain/features/types"

export class FeatureService {
  private dbAdapter: SupabaseDbAdapter

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
  }

  async getFeaturesByProjectId(projectId: string): Promise<Feature[]> {
    return this.dbAdapter.getFeaturesByProjectId(projectId)
  }

  async getFeatureById(id: string): Promise<Feature | null> {
    return this.dbAdapter.getFeatureById(id)
  }

  async createFeature(dto: CreateFeatureDTO): Promise<Feature> {
    const trimmedName = dto.name.trim()
    if (!trimmedName) {
      throw new Error("Feature name is required and cannot be empty")
    }

    // Verify project exists
    const project = await this.dbAdapter.getProjectById(dto.project_id)
    if (!project) {
      throw new Error(`Project ${dto.project_id} does not exist`)
    }

    return this.dbAdapter.createFeature({
      ...dto,
      name: trimmedName,
      workflow_key: dto.workflow_key || "manual_test_design",
    })
  }

  async updateFeature(id: string, dto: UpdateFeatureDTO): Promise<Feature> {
    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim()
      if (!trimmedName) {
        throw new Error("Feature name cannot be empty")
      }
      dto.name = trimmedName
    }
    return this.dbAdapter.updateFeature(id, dto)
  }

  async deleteFeature(id: string): Promise<void> {
    return this.dbAdapter.deleteFeature(id)
  }
}

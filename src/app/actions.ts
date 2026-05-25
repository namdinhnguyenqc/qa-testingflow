"use server"

import { revalidatePath } from "next/cache"
import { ProjectService } from "@/application/projects/project-service"
import { FeatureService } from "@/application/features/feature-service"
import { InputService } from "@/application/inputs/input-service"
import { ClarificationService } from "@/application/clarifications/clarification-service"
import { TestCaseService } from "@/application/testcases/testcase-service"
import { CreateProjectDTO, UpdateProjectDTO } from "@/domain/projects/types"
import { CreateFeatureDTO, UpdateFeatureDTO } from "@/domain/features/types"
import { CreateTestCaseDTO } from "@/domain/testcases/types"

const projectService = new ProjectService()
const featureService = new FeatureService()
const inputService = new InputService()
const clarificationService = new ClarificationService()
const testCaseService = new TestCaseService()

// === Projects Actions ===

export async function getProjectsAction() {
  try {
    return { data: await projectService.getProjects() }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getProjectByIdAction(id: string) {
  try {
    return { data: await projectService.getProjectById(id) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createProjectAction(dto: CreateProjectDTO) {
  try {
    const project = await projectService.createProject(dto)
    revalidatePath("/")
    return { data: project }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateProjectAction(id: string, dto: UpdateProjectDTO) {
  try {
    const project = await projectService.updateProject(id, dto)
    revalidatePath("/")
    revalidatePath(`/projects/${id}`)
    return { data: project }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteProjectAction(id: string) {
  try {
    await projectService.deleteProject(id)
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// === Features Actions ===

export async function getFeaturesByProjectIdAction(projectId: string) {
  try {
    return { data: await featureService.getFeaturesByProjectId(projectId) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getFeatureByIdAction(id: string) {
  try {
    return { data: await featureService.getFeatureById(id) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createFeatureAction(dto: CreateFeatureDTO) {
  try {
    const feature = await featureService.createFeature(dto)
    revalidatePath(`/projects/${dto.project_id}`)
    return { data: feature }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateFeatureAction(id: string, dto: UpdateFeatureDTO, projectId: string) {
  try {
    const feature = await featureService.updateFeature(id, dto)
    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/features/${id}`)
    return { data: feature }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteFeatureAction(id: string, projectId: string) {
  try {
    await featureService.deleteFeature(id)
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// === Inputs Actions ===

export async function getInputSourcesAction(featureId: string) {
  try {
    const sources = await inputService.getInputSources(featureId)
    // Sinh signed urls cho các files nếu có
    const sourcesWithSignedUrls = await Promise.all(
      sources.map(async (source) => {
        if (source.storage_path && source.processing_status !== "REMOVED") {
          try {
            const signedUrl = await inputService.getSignedUrl(source.storage_path)
            return { ...source, signedUrl }
          } catch {
            return source
          }
        }
        return source
      })
    )
    return { data: sourcesWithSignedUrls }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function savePastedRequirementAction(featureId: string, projectId: string, text: string) {
  try {
    const source = await inputService.savePastedRequirement(featureId, text)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: source }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function removeInputSourceAction(id: string, featureId: string, projectId: string) {
  try {
    await inputService.removeInputSource(id, featureId)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// === Clarifications Actions ===

export async function runRequirementAnalysisAction(projectId: string, featureId: string, modelId: string) {
  try {
    const artifact = await clarificationService.runRequirementAnalysis(projectId, featureId, modelId)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: artifact }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getClarificationThreadAction(featureId: string) {
  try {
    return { data: await clarificationService.getThreadWithMessages(featureId) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function submitUserAnswersAction(
  featureId: string,
  projectId: string,
  answers: { questionKey: string; content: string }[]
) {
  try {
    const messages = await clarificationService.submitUserAnswers(featureId, answers)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: messages }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function runReadinessAndUnderstandingAction(projectId: string, featureId: string, modelId: string) {
  try {
    const artifact = await clarificationService.runReadinessAndUnderstanding(projectId, featureId, modelId)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: artifact }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function confirmUnderstandingAction(artifactId: string, featureId: string, projectId: string) {
  try {
    const artifact = await clarificationService.confirmUnderstanding(artifactId, featureId, projectId)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: artifact }
  } catch (error: any) {
    return { error: error.message }
  }
}

// === Test Cases Actions ===

export async function getLatestArtifactByTypeAction(featureId: string, type: any) {
  try {
    const dbAdapter = clarificationService["dbAdapter"]
    return { data: await dbAdapter.getLatestArtifactByType(featureId, type) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getFeatureHistoryAction(featureId: string) {
  try {
    const dbAdapter = clarificationService["dbAdapter"]
    const [stepRuns, artifacts] = await Promise.all([
      dbAdapter.getStepRunsByFeatureId(featureId),
      dbAdapter.getArtifactsByFeatureId(featureId),
    ])
    return { data: { stepRuns, artifacts } }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function generateTestCasesAction(
  projectId: string,
  featureId: string,
  modelId: string,
  isDraftWithAssumptions = false
) {
  try {
    const result = await testCaseService.generateTestCases({
      projectId,
      featureId,
      modelId,
      isDraftWithAssumptions,
    })
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: result }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getTestCasesAction(artifactId: string) {
  try {
    return { data: await testCaseService.getTestCases(artifactId) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateTestCaseAction(id: string, updates: any, artifactId: string, projectId: string, featureId: string) {
  try {
    const testcase = await testCaseService.updateTestCase(id, updates)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: testcase }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createManualTestCaseAction(dto: CreateTestCaseDTO, projectId: string) {
  try {
    const testcase = await testCaseService.createManualTestCase(dto)
    revalidatePath(`/projects/${projectId}/features/${dto.feature_id}`)
    return { data: testcase }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteTestCaseAction(id: string, artifactId: string, projectId: string, featureId: string) {
  try {
    await testCaseService.deleteTestCase(id)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function saveFinalTestCaseVersionAction(featureId: string, artifactId: string, projectId: string) {
  try {
    const finalArtifact = await testCaseService.saveFinalVersion(featureId, artifactId)
    revalidatePath(`/projects/${projectId}/features/${featureId}`)
    return { data: finalArtifact }
  } catch (error: any) {
    return { error: error.message }
  }
}

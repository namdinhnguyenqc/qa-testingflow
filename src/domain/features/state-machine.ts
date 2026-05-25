import { FeatureStatus } from "./types"
import { InputSource } from "../inputs/types"

/**
 * Xác định trạng thái tiếp theo của feature dựa trên các tài liệu đầu vào (Input Sources) hiện có.
 */
export function determineFeatureStatus(
  currentStatus: FeatureStatus,
  sources: InputSource[]
): FeatureStatus {
  // Chỉ tự động tính toán nếu đang ở DRAFT hoặc INPUT_READY. Các state sau do AI runner điều khiển.
  if (currentStatus !== "DRAFT" && currentStatus !== "INPUT_READY") {
    return currentStatus
  }

  const activeSources = sources.filter((s) => s.status !== "REMOVED")

  // Kiểm tra xem có bất kỳ nguồn requirement hợp lệ nào không
  const hasValidRequirement = activeSources.some(
    (source) =>
      (source.source_type === "requirement_text" &&
        source.text_content &&
        source.text_content.trim().length >= 10) ||
      (source.source_type === "requirement_file" &&
        source.status === "TEXT_AVAILABLE")
  )

  if (hasValidRequirement) {
    return "INPUT_READY"
  }

  return "DRAFT"
}

/**
 * Kiểm tra xem một bước chuyển trạng thái có hợp lệ hay không.
 */
export function isValidTransition(
  from: FeatureStatus,
  to: FeatureStatus
): boolean {
  const allowedTransitions: Record<FeatureStatus, FeatureStatus[]> = {
    DRAFT: ["INPUT_READY", "FAILED"],
    INPUT_READY: ["DRAFT", "ANALYZING", "FAILED"],
    ANALYZING: ["NEEDS_CLARIFICATION", "READY_FOR_UNDERSTANDING", "FAILED"],
    NEEDS_CLARIFICATION: ["ANALYZING", "READY_FOR_UNDERSTANDING", "TESTCASE_DRAFTED", "FAILED"], // TESTCASE_DRAFTED cho TH Draft-with-assumptions
    READY_FOR_UNDERSTANDING: ["UNDERSTANDING_REVIEW", "FAILED"],
    UNDERSTANDING_REVIEW: ["UNDERSTANDING_CONFIRMED", "NEEDS_CLARIFICATION", "FAILED"],
    UNDERSTANDING_CONFIRMED: ["TESTCASE_GENERATING", "FAILED"],
    TESTCASE_GENERATING: ["TESTCASE_DRAFTED", "FAILED"],
    TESTCASE_DRAFTED: ["COMPLETED", "FAILED"],
    COMPLETED: ["DRAFT", "INPUT_READY", "ANALYZING"], // Cho phép rerun version mới
    FAILED: ["DRAFT", "INPUT_READY", "ANALYZING", "NEEDS_CLARIFICATION", "READY_FOR_UNDERSTANDING", "UNDERSTANDING_REVIEW", "UNDERSTANDING_CONFIRMED", "TESTCASE_GENERATING", "TESTCASE_DRAFTED", "COMPLETED"], // Có thể retry về bất kỳ state nào trước đó
  }

  return allowedTransitions[from]?.includes(to) ?? false
}

# Phase 01 Tasks — Manual QA Workflow MVP

> Chỉ bắt đầu sau khi Phase 00 đạt exit gate. Không triển khai MCP/automation trong phase này.

---

## P01-T01 — Extend database for AI runs, artifacts, clarifications, testcases

### Tasks

- Tạo migrations: `workflow_runs`, `step_runs`, `clarification_threads`, `clarification_messages`, `artifacts`, `test_cases`, `export_files`.
- Tạo domain types/enums và repositories/services.
- Implement artifact versioning và lineage.
- Implement feature status transitions theo state machine.

### Tests

- Version increments đúng.
- Không cho invalid status transition.
- Save generated và final testcase artifacts tách biệt.

---

## P01-T02 — qa-core manual workflow + skill/schema baseline

### Tasks

- Tạo/copy workflow Markdown Manual Test Design.
- Tạo skills: requirement reader, gap analysis, clarification, readiness, feature understanding, testcase generator/reviewer.
- Tạo schema files/loader contract và template columns.
- Implement `SkillLoaderService`/`WorkflowLoaderService` read-only.
- Capture build/skill revision metadata.

### Tests

- Load valid workflow/skill.
- Fail rõ khi file/reference/schema missing.

---

## P01-T03 — Model adapter & structured output validation

### Tasks

- Define `ModelAdapter` interface và cấu hình provider/model server-side.
- Implement selected provider adapter đầu tiên.
- Implement context builder theo step.
- Implement JSON extraction, AJV schema validation và semantic validators.
- Implement repair attempt policy có giới hạn.
- Save `step_run` metadata/status/output.

### Must not do

- Không gọi model từ client component.
- Không lưu invalid output thành artifact success.

### Tests

- Fake model valid output.
- Invalid schema → repair success.
- Invalid schema → repair failed.
- Provider timeout/error.

---

## P01-T04 — Requirement Analysis UI & execution

### Tasks

- Enable Analysis step trong Feature Workspace.
- Run analysis action/service.
- Display source used/model/skill/version.
- Render confirmed, missing critical/noncritical, conflicts, assumptions.
- Update feature state theo output.
- Support rerun/switch model tạo version mới.

### Acceptance

- User nhìn thấy lý do phải clarification hoặc được tiếp tục.

---

## P01-T05 — Clarification Center & readiness evaluation

### Tasks

- Render critical questions theo category.
- Cho user save/submit answers hoặc mark pending.
- Re-run readiness evaluation bằng answer context.
- Timeline/history câu hỏi-trả lời.
- Block official TC khi critical chưa resolved.

### Tests

- Missing critical → block.
- Answers resolve gaps → state chuyển ready.
- Pending critical → vẫn block.

---

## P01-T06 — Feature Understanding confirmation gate

### Tasks

- Generate Feature Understanding artifact khi readiness pass.
- Render summary theo section.
- User confirm/request revision/back to clarification.
- Khi confirm, update state và lưu timestamp/status artifact.

### Acceptance

- Không có official TC nếu chưa confirm.

---

## P01-T07 — Manual Testcase generation & editable table

### Tasks

- Generate testcase artifact từ confirmed understanding.
- Render editable TanStack Table/detail editor.
- Support filter, edit, add/remove, save final version.
- Hiển thị requirement mapping/automation candidate.
- Support draft-with-assumptions path rõ warning.

### Tests

- Official generation gate.
- TC ID uniqueness/required expected validation.
- Final version tách original generated version.

---

## P01-T08 — Excel export

### Tasks

- Implement export service từ selected testcase artifact.
- Dùng template columns trong `qa-core/templates`.
- Generate XLSX có tên file chuẩn.
- Download và optional persist metadata/file.

### Tests

- File có đúng sheet/columns/order/rows.
- Export final/draft đúng status được chọn.

---

## P01-T09 — History, error UX, E2E and deployment verification

### Tasks

- History tab cho step runs/artifacts/exports.
- Loading/failure/retry/switch model UX.
- E2E critical path với fake model adapter.
- Preview deployment verification dùng data demo.
- Update README sử dụng MVP.

### Definition of Done Phase 01

- [ ] Full manual journey hoạt động.
- [ ] Gate và schema validation hoạt động.
- [ ] Testcase/Excel output dùng thực tế được.
- [ ] Persistence/history hoạt động.
- [ ] Không có MCP/automation ngoài scope.

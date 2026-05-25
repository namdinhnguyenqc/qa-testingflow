# Data Model & Storage Specification — QAFlow AI

## 1. Mục tiêu dữ liệu

Hệ thống phải lưu được toàn bộ vòng đời một feature QA:

```text
Project
  └── Feature
       ├── Input Sources
       ├── Workflow Runs / Step Runs
       ├── Clarification Threads & Messages
       ├── Artifacts theo version
       ├── Test Cases / Final Versions
       └── Export Files
```

Dữ liệu phải tồn tại sau refresh/redeploy và truy ngược được: output nào sinh từ input/model/skill/schema nào.

---

## 2. Data Ownership

| Nhóm dữ liệu | Nguồn chuẩn | Lý do |
|---|---|---|
| Source code, skills, workflow, schemas, templates | GitHub repo | Review/version/rollback bằng Git |
| Project, feature, step/run metadata | Supabase Postgres | Query/filter/persistence |
| AI structured artifacts | Supabase Postgres JSONB | Version + traceability + downstream reuse |
| Testcase row data | Supabase Postgres | Edit/filter/export/future automation mapping |
| Input/output files | Supabase private Storage | Persistent binary files ngoài serverless filesystem |

---

## 3. Entity Relationship Overview

```text
projects 1 ─── n features
features 1 ─── n input_sources
features 1 ─── n workflow_runs
workflow_runs 1 ─── n step_runs
features 1 ─── n clarification_threads
clarification_threads 1 ─── n clarification_messages
features 1 ─── n artifacts
artifacts 1 ─── n test_cases        (khi artifact type = testcase_set)
features 1 ─── n export_files
```

---

## 4. Core Tables — MVP

## 4.1. `projects`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | Generated UUID |
| `name` | text | Yes | Không rỗng; unique optional trong MVP |
| `description` | text | No | Mô tả sản phẩm |
| `default_model_id` | text | No | Model gợi ý ban đầu |
| `created_at` | timestamptz | Yes | Default now |
| `updated_at` | timestamptz | Yes | Update trigger/app handling |

## 4.2. `features`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `project_id` | uuid FK | Yes | Cascade policy phải được xác nhận trước implement delete |
| `name` | text | Yes | Tên tính năng |
| `description` | text | No | Mô tả user nhập |
| `workflow_key` | text | Yes | MVP: `manual_test_design` |
| `selected_model_id` | text | No | Default từ project hoặc user chọn |
| `status` | text | Yes | Theo state machine |
| `current_step_key` | text | No | Bước đang ở |
| `created_at` | timestamptz | Yes | |
| `updated_at` | timestamptz | Yes | |

### Valid feature status MVP

```text
DRAFT
INPUT_READY
ANALYZING
NEEDS_CLARIFICATION
READY_FOR_UNDERSTANDING
UNDERSTANDING_REVIEW
UNDERSTANDING_CONFIRMED
TESTCASE_GENERATING
TESTCASE_DRAFTED
COMPLETED
FAILED
```

## 4.3. `input_sources`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `feature_id` | uuid FK | Yes | |
| `source_type` | text | Yes | `requirement_text`, `requirement_file`, `figma_image`, `figma_pdf`, `figma_url`, `api_doc`, `staging_url`, `existing_tc` |
| `title` | text | No | User-friendly label |
| `original_file_name` | text | No | Với file upload |
| `storage_bucket` | text | No | `qa-inputs` |
| `storage_path` | text | No | Sanitized path |
| `mime_type` | text | No | |
| `size_bytes` | bigint | No | |
| `text_content` | text | No | Với paste/extracted text |
| `processing_status` | text | Yes | `UPLOADED`, `TEXT_AVAILABLE`, `REFERENCE_ONLY`, `PARSE_FAILED`, `REMOVED` |
| `created_at` | timestamptz | Yes | |

### Rule

File binary không lưu trong DB; chỉ metadata và extracted/pasted content phù hợp.

## 4.4. `workflow_runs`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `feature_id` | uuid FK | Yes | |
| `workflow_key` | text | Yes | |
| `workflow_file_path` | text | Yes | Trace file dùng |
| `workflow_revision` | text | No | App build/Git commit |
| `initiated_model_id` | text | No | Model mặc định run |
| `status` | text | Yes | `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `started_at` | timestamptz | Yes | |
| `completed_at` | timestamptz | No | |

## 4.5. `step_runs`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `workflow_run_id` | uuid FK | Yes | |
| `feature_id` | uuid FK | Yes | Denormalize for query convenience |
| `step_key` | text | Yes | Ví dụ `requirement_analysis` |
| `skill_file_path` | text | Yes | |
| `skill_revision` | text | No | Build/git revision |
| `schema_key` | text | Yes | Output schema reference |
| `schema_version` | text | Yes | |
| `provider_id` | text | Yes | |
| `model_id` | text | Yes | |
| `input_snapshot_json` | jsonb | Yes | Context/sources refs đã dùng; tránh chứa binary |
| `raw_output_text` | text | No | Chỉ lưu nếu policy cho phép; hữu ích debug |
| `validated_output_json` | jsonb | No | Chỉ có khi validation pass |
| `validation_status` | text | Yes | `PENDING`, `VALID`, `INVALID`, `REPAIRED`, `FAILED` |
| `repair_attempts` | integer | Yes | Default 0 |
| `error_summary` | text | No | Không log secret |
| `status` | text | Yes | `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED` |
| `created_at` | timestamptz | Yes | |
| `completed_at` | timestamptz | No | |

## 4.6. `clarification_threads`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `feature_id` | uuid FK | Yes | |
| `source_artifact_id` | uuid FK | No | Analysis dẫn đến thread |
| `status` | text | Yes | `OPEN`, `READY_FOR_REVIEW`, `RESOLVED` |
| `created_at` | timestamptz | Yes | |

## 4.7. `clarification_messages`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `thread_id` | uuid FK | Yes | |
| `feature_id` | uuid FK | Yes | |
| `sender_type` | text | Yes | `AI`, `USER` |
| `category` | text | No | business_rule/validation/permission/state/error/ui_conflict |
| `content` | text | Yes | |
| `is_critical` | boolean | Yes | Default false |
| `question_key` | text | No | Dùng map answer về question |
| `related_source_refs` | jsonb | No | |
| `created_at` | timestamptz | Yes | |

## 4.8. `artifacts`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `feature_id` | uuid FK | Yes | |
| `step_run_id` | uuid FK | No | User-edited artifact có thể derive từ artifact cũ |
| `parent_artifact_id` | uuid FK | No | Version lineage |
| `artifact_type` | text | Yes | `REQUIREMENT_ANALYSIS`, `READINESS_RESULT`, `FEATURE_UNDERSTANDING`, `TESTCASE_SET`, `TESTCASE_FINAL` |
| `version_no` | integer | Yes | Increment per type/feature |
| `content_json` | jsonb | Yes | Canonical content |
| `schema_key` | text | Yes | |
| `schema_version` | text | Yes | |
| `status` | text | Yes | `DRAFT`, `CONFIRMED`, `FINAL`, `SUPERSEDED` |
| `created_at` | timestamptz | Yes | |
| `confirmed_at` | timestamptz | No | |

## 4.9. `test_cases`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `feature_id` | uuid FK | Yes | |
| `artifact_id` | uuid FK | Yes | Testcase set/version nguồn |
| `test_case_code` | text | Yes | Ví dụ `TC_INV_001` |
| `module` | text | Yes | |
| `scenario` | text | Yes | |
| `case_type` | text | Yes | |
| `priority` | text | Yes | |
| `preconditions_json` | jsonb | Yes | Array/string normalized |
| `steps_json` | jsonb | Yes | Mỗi step có action + expected nếu template yêu cầu |
| `test_data_json` | jsonb | No | |
| `expected_result` | text | Yes | |
| `automation_candidate` | boolean | Yes | |
| `requirement_mapping_json` | jsonb | No | |
| `status` | text | Yes | `DRAFT`, `FINAL` |
| `created_at` | timestamptz | Yes | |

## 4.10. `export_files`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid PK | Yes | |
| `feature_id` | uuid FK | Yes | |
| `artifact_id` | uuid FK | Yes | Export từ testcase version nào |
| `export_type` | text | Yes | `XLSX` |
| `storage_bucket` | text | No | Nếu lưu output |
| `storage_path` | text | No | |
| `file_name` | text | Yes | |
| `created_at` | timestamptz | Yes | |

---

## 5. Storage Layout

## 5.1. Buckets

| Bucket | Access mặc định | Dùng cho |
|---|---|---|
| `qa-inputs` | Private | Requirement docs, Figma screenshots/PDF, API docs |
| `qa-outputs` | Private | Exported Excel, rendered artifacts nếu lưu |
| `qa-evidence` | Private, phase sau | Trace, screenshot, report, video |

## 5.2. Path convention

```text
qa-inputs/
  projects/{projectId}/features/{featureId}/requirements/{uuid}-{safeFilename}
  projects/{projectId}/features/{featureId}/figma/{uuid}-{safeFilename}
  projects/{projectId}/features/{featureId}/api/{uuid}-{safeFilename}

qa-outputs/
  projects/{projectId}/features/{featureId}/testcases/v{version}/{safeFileName}.xlsx

qa-evidence/  # future
  projects/{projectId}/runs/{runId}/failed/{testCaseId}/trace.zip
```

### Rules

- Path dùng UUID; không dựa duy nhất trên filename user upload.
- Filename hiển thị lưu metadata riêng.
- Bucket private; download bằng server route/signed URL ngắn hạn khi có access gate.
- Validate MIME, extension và size trước upload.

---

## 6. Artifact Versioning Strategy

Không overwrite output AI hoặc output đã confirm.

```text
Requirement Analysis v1 (Claude, skill commit A)
Requirement Analysis v2 (Codex, skill commit A)
Feature Understanding v1 (derived from Analysis v1 + Answers)
Feature Understanding v2 (user requested revision)
Testcase Set v1 (AI generated)
Testcase Final v1 (user edited & saved)
```

### Required metadata

- `parent_artifact_id` cho lineage.
- `step_run_id` cho AI-generated artifacts.
- `status` rõ ràng: draft/confirmed/final/superseded.
- Không được dùng testcase draft làm automation source chính thức sau này.

---

## 7. Data Retention MVP

| Data | Retention đề xuất |
|---|---|
| Input docs/Figma | Giữ tới khi user chủ động xóa project/feature |
| Structured artifacts | Giữ toàn bộ version để đánh giá skill |
| Testcase final/Excel | Giữ lâu dài |
| Raw AI response | Có thể giữ trong dev; cân nhắc hạn chế khi chứa dữ liệu nhạy cảm |
| Failed parsing/temp files | Xóa theo job housekeeping về sau |
| Regression evidence future | Failed-only + retention giới hạn |

---

## 8. Delete Behaviour cần chốt trước khi implement

MVP có thể chọn **soft delete** cho project/feature/input vì artifact là dữ liệu giá trị.

### Khuyến nghị

- Thêm `deleted_at` ở `projects`, `features`, `input_sources` nếu triển khai delete.
- UI ẩn deleted records.
- Không hard-delete storage/files ngay trong MVP nếu chưa có recovery flow.
- Nếu muốn đơn giản hơn: Phase 00 chỉ hỗ trợ create/edit/list/open; hoãn delete sang task riêng.

---

## 9. Indexing đề xuất

- Index `features(project_id, updated_at)`.
- Index `input_sources(feature_id, created_at)`.
- Index `workflow_runs(feature_id, started_at)`.
- Index `step_runs(feature_id, created_at)`.
- Index `artifacts(feature_id, artifact_type, version_no)`.
- Index `test_cases(feature_id, artifact_id, test_case_code)`.

---

## 10. Migration Rules

- Không sửa DB bằng tay mà không tạo migration committed.
- Migration đặt tên timestamp rõ mục đích.
- Mọi enum/status dùng constraint hoặc application enum có test; tránh string không kiểm soát.
- Seed chỉ chứa data demo, không chứa credentials/doc thật.

# Dev A — Backend + AI/Workflow Core

> Plan copy-paste-ready. Mỗi task có **Build / Dep / DoD** (Definition of Done). Tick `[x]` khi xong.
> Bạn là **critical path** của dự án — mọi tab frontend phụ thuộc skill/endpoint của bạn. Ưu tiên giữ contract ổn định và báo sớm khi schema đổi.

## Context

Hệ thống: **config-driven AI QA platform**. Luồng chính:
`Upload requirement → Analyze → Quality + Gap → Gap review → Rewrite → Approval gate → Generate testcase → Coverage → Review → Export Excel.`
Bạn build toàn bộ backend: parser, skill runtime, AI provider gateway, workflow orchestrator, coverage/export engine, audit + cost, secret management.

## Stack (đã chốt)

- Backend: **NestJS** (TypeScript), kiến trúc module-per-domain (`project / artifact / requirement / gap / testcase / coverage / export / config / ai-gateway / workflow`).
- DB: **PostgreSQL** — ORM **Prisma** (schema + migration + typed client); pgvector (extension) ở Phase 3. *(Đổi sang TypeORM được nếu team quen hơn.)*
- Async: **BullMQ + Redis** cho queue/workflow jobs.
- Object storage: MinIO/S3 cho file upload + export.
- Validation: `class-validator` cho DTO request; **ajv** cho JSON schema output AI (§12).
- Secret: `@nestjs/config` + env ở Phase 0–2, Vault/KMS ở Phase 3.

## Quy ước (bắt buộc đọc trước khi code)

- **Schema-first:** mọi output AI phải validate theo JSON schema (spec §12). Sai schema → retry → (Phase 2) auto-repair → fallback → mark failed.
- **Không lưu API key plain text.** Chỉ lưu `secret_ref`; response/log luôn masked.
- **ID convention** (spec chưa định nghĩa — dùng tạm, chốt lại với BA):
  `REQ_<MODULE>_<NNN>`, `GAP_<MODULE>_<NNN>`, `TC_<MODULE>_<FEATURE>_<NNN>`.
- **Mọi step AI chạy async** qua queue + `workflow_runs`, expose status theo §7.2.
- Branch theo feature + PR review; sprint 2 tuần, demo cuối sprint.

## Cần CHỐT với BA trước khi build (ảnh hưởng logic của bạn)

- [ ] Gate fail = **block** hay **warning + override**? (ảnh hưởng A1.7, A1.9)
- [ ] Coverage % có tính requirement **Not Testable** trong mẫu số không?
- [ ] `testcase_sets` có cần cột **version_no** không? (spec §6.5 yêu cầu version nhưng §11.6 thiếu field) → mình đề xuất **có**.
- [ ] File size limit cuối cùng (global 30MB vs per-tool image 10 / xlsx 20).
- [ ] Default language output (EN/VI).

---

## Phase 0 — Foundation (2 tuần)

- [ ] **A0.1 Repo + infra**
  - Build: NestJS app scaffold, CI/CD, Docker compose (Postgres + Redis + MinIO), lint/format/test, `prisma init`.
  - DoD: `docker compose up` chạy, CI xanh trên PR.
- [ ] **A0.2 DB core migrations**
  - Build: Prisma schema cho `projects`, `artifacts`, `config_versions` (spec §11.1, §11.2, §11.11) + enum status; `prisma migrate`.
  - DoD: migrate dev/deploy sạch; seed 1 project.
- [ ] **A0.3 Contract + JSON schemas (co-own với Dev B)**
  - Build: OpenAPI cho §13 + JSON schema §12 (requirement/quality/gap/testcase/coverage). Commit vào `/contracts`.
  - DoD: file schema validate được bằng ajv/jsonschema; Dev B mock được từ OpenAPI.
- [ ] **A0.4 AI Provider Gateway scaffold**
  - Build: `AiGatewayModule` với interface `AIProviderAdapter` (§10.2) + OpenAI adapter (injectable provider) + endpoint `POST /configs/ai-providers/{id}/test-connection`.
  - Dep: A0.3.
  - DoD: gọi 1 prompt thật trả structured JSON; testConnection trả `{ok, models}`.
- [ ] **A0.5 Secret abstraction**
  - Build: resolve `secret_ref` từ env; mask khi trả về/ghi log.
  - DoD: GET provider không bao giờ lộ key thật.
- [ ] **A0.6 Project CRUD**
  - Build: `POST/GET/PATCH/DELETE /projects` (§13) + default config override (§8.4).
  - DoD: Dev B tạo/sửa project end-to-end qua API thật.

**Milestone P0:** tạo project + 1 lần gọi AI test thành công.

---

## Phase 1 — Core flow / MVP1 (6 tuần)

- [ ] **A1.1 Parser tools**
  - Build: `document_parser` (pdf/docx/txt), `spreadsheet_parser` (xlsx/csv), `image_reader` (vision/OCR) → `parsed_artifact_schema`. Áp size limit (§9.6).
  - DoD: upload mỗi loại file → parsed output chuẩn; file lỗi trả reason (§14.1).
- [ ] **A1.2 Skill Runtime Engine (base)**
  - Build: `SkillRuntimeModule`: load skill config → prompt template → model policy → gọi `AiGateway` → validate output bằng **ajv** theo schema (§12) → retry on fail.
  - Dep: A0.4.
  - DoD: chạy 1 skill dummy end-to-end, log vào `ai_call_logs`.
- [ ] **A1.3 Skill `requirement_reader`**
  - Build: parsed → `requirement_schema_v1`; split atomic items; persist `requirement_versions` + `requirement_items` (§11.3, §11.4).
  - Dep: A1.1, A1.2.
  - DoD: doc mẫu → ≥N item, mỗi item có id/module/feature/type/priority/testable; pass schema.
- [ ] **A1.4 Skill `requirement_quality_checker`**
  - Build: requirement → quality schema (§12.2), tính score theo 8 dimension.
  - DoD: trả score 0–100 + breakdown.
- [ ] **A1.5 Skill `gap_detector`**
  - Build: requirement → gap schema (§12.3); persist `gap_items` (§11.5) với severity/confidence/evidence.
  - DoD: trả gap có category thuộc list §8.8; mỗi gap có evidence + confidence.
- [ ] **A1.6 Skill `requirement_rewriter` + versioning**
  - Build: gap resolution → requirement version mới; lưu `content_json` + `content_markdown` để diff.
  - DoD: mỗi rewrite tạo version mới; API trả history + diff data (§8.9).
- [ ] **A1.7 Approval gate engine**
  - Build: rule `min_quality_score`, `block_if_open_gaps` (§9.8) + `POST /requirements/versions/{id}/approve` (lock).
  - Dep: A1.4, A1.5, A1.6 + chốt block/warn.
  - DoD: approve khi pass; bị chặn/cảnh báo đúng config; approved → locked.
- [ ] **A1.8 Skill `testcase_generator`**
  - Build: approved requirement + config (§8.10) → `testcase_schema`; persist `testcase_sets` (kèm version_no) + `test_cases` (§11.6, §11.7).
  - Dep: A1.7.
  - DoD: chỉ approved mới generate; mỗi TC có `requirement_refs`; pass schema.
- [ ] **A1.9 Skill `coverage_checker`**
  - Build: map requirement ↔ testcase → coverage schema (§12.5); persist `coverage_items`; tính coverage %.
  - Dep: A1.8 + chốt cách tính Not Testable.
  - DoD: mỗi requirement có status covered/partial/missing/not-testable; coverage % tự động.
- [ ] **A1.10 Excel Exporter**
  - Build: sheet **Test Cases** tối thiểu (§8.13, template §9.10) → object storage + bản ghi export artifact.
  - DoD: export ra .xlsx tải được; lưu lịch sử export.
- [ ] **A1.11 Workflow Orchestrator**
  - Build: **BullMQ** queue async, `workflow_runs` (§11.9), status transitions (§7.2), on_success/on_failure (§9.7), retry/cancel endpoints.
  - DoD: chạy full workflow; status đổi đúng; có `trace_id`.
- [ ] **A1.12 AI call logs**
  - Build: `ai_call_logs` (§11.10) lưu provider/model/skill version/prompt version/tokens.
  - DoD: mỗi AI call có 1 log; key không xuất hiện trong log.

**Milestone P1:** demo Upload → Export với requirement thật.

---

## Phase 2 — Config & robustness / MVP2 (4–6 tuần)

- [ ] **A2.1 Anthropic adapter + fallback** — model policy primary/fallback (§9.3, 10.4). DoD: primary fail → fallback chạy, log rõ provider dùng.
- [ ] **A2.2 Prompt versioning** — CRUD + activate, 1 active/prompt name (§9.5). DoD: đổi prompt không deploy; TC cũ vẫn trace prompt version cũ.
- [ ] **A2.3 JSON auto-repair + fallback chain** (§6.3). DoD: output sai schema được sửa/retry/fallback trước khi fail.
- [ ] **A2.4 Quality gate engine tổng quát** + override flag (§9.8). DoD: cấu hình gate qua config, override ghi label.
- [ ] **A2.5 Audit log service** — events §8.14, mask secret (§16). DoD: mọi action quan trọng được log, filter theo project/user/action.
- [ ] **A2.6 Cost tracking** — track_by + budget warning 80% (§17). DoD: cost theo project/provider/model; cảnh báo khi vượt ngưỡng.
- [ ] **A2.7 Skill `figma_reader`** + Figma API tool (read_file/nodes/export image), **non-blocking** khi lỗi (§10.7, INPUT-AC-05). DoD: Figma lỗi chỉ warning, workflow vẫn chạy.

**Milestone P2:** admin reconfigure không cần deploy; fallback hoạt động.

---

## Phase 3 — Scale & polish / MVP3 (4 tuần)

- [ ] **A3.1 Vault/KMS** thật + rotate secret. DoD: key lưu Vault, rotate không downtime.
- [ ] **A3.2 pgvector** requirement chunks/search.
- [ ] **A3.3 Workflow builder config** (load/validate `workflow_versions`).
- [ ] **A3.4 Prompt version compare** endpoint.
- [ ] **A3.5 Cost dashboard data** endpoints.
- [ ] **A3.6 Hardening** — unit/integration test service chính, trace_id xuyên suốt, error states đầy đủ (§14, §19.2).

**Milestone P3:** đạt Technical DoD (§19.2).

---

## Điểm sync với Dev B

- Cuối P0: **freeze contract v1**; mock của Dev B khớp endpoint thật.
- P1 hằng tuần: báo trước mọi thay đổi schema/endpoint; Dev B dùng mock tới khi endpoint sẵn.
- Các endpoint Dev B cần sớm theo thứ tự: project CRUD → artifact/parse → analyze/quality → gap → rewrite/diff/approve → testcase generate → coverage → export.

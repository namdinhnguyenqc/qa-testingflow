# System Architecture — QAFlow AI

## 1. Mục tiêu kiến trúc

Thiết kế hệ thống đủ nhẹ để dựng MVP nhanh, nhưng không khóa đường mở rộng sang MCP/automation/regression. Hệ thống phải tách rõ:

1. Website/UI cho tester.
2. Business/application workflow.
3. AI orchestration và model adapters.
4. Skill/workflow assets trong GitHub.
5. Persistent DB/storage ngoài Vercel.
6. Worker execution riêng cho browser/test jobs ở phase sau.

---

## 2. Architecture Drivers

| Driver | Tác động thiết kế |
|---|---|
| Team muốn dùng website | Web deploy được, UI dễ thao tác, dữ liệu xem lại được |
| Skill chỉnh bằng `.md` | Skill/workflow là file versioned trong repo, không hard-code prompt trong UI |
| Switch model | Model adapter interface + output validator |
| Output cùng format | JSON contract + validation trước lưu/render |
| Deploy Vercel | Không lưu SQLite/runtime file; dùng external DB/storage |
| Automation/MCP sau | Worker riêng; không nhét browser run dài vào web runtime |
| Không làm RBAC sớm | MVP đơn giản, nhưng vẫn thiết kế access gate tối thiểu trước dữ liệu thật |

---

## 3. Architecture Overview — MVP

```text
┌──────────────────────────────────────────────────────────────┐
│                      Browser / Tester                        │
│ Project | Feature | Inputs | Clarification | TC Table | Export│
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────┐
│            Next.js Web Application — Deploy on Vercel        │
│                                                              │
│ UI Pages / Route Handlers / Server Actions                   │
│ Application Services                                         │
│ Workflow Runner                                              │
│ Artifact / Export Service                                    │
└───────────┬───────────────────┬───────────────────┬──────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐
│ Supabase Postgres│  │ Supabase Storage │  │ qa-core assets     │
│ persistent data  │  │ private files    │  │ in Git repository  │
└──────────────────┘  └──────────────────┘  │ workflow/skill/   │
                                             │ schema/template   │
                                             └─────────┬─────────┘
                                                       │
                                                       ▼
                                           ┌───────────────────────┐
                                           │ AI Orchestrator       │
                                           │ - build prompt/context│
                                           │ - call adapter        │
                                           │ - validate output     │
                                           │ - save artifact       │
                                           └───────────┬───────────┘
                                                       │
                                                       ▼
                                           ┌───────────────────────┐
                                           │ Model Provider        │
                                           │ Claude/Codex/OpenAI-  │
                                           │ compatible endpoint   │
                                           └───────────────────────┘
```

---

## 4. Kiến trúc sau khi có Automation/MCP

```text
┌──────────────────────────────┐
│ Next.js Web App / Vercel     │
│ Create Job / Show Result     │
└──────────────┬───────────────┘
               │ enqueue job / persist status
               ▼
┌──────────────────────────────┐
│ DB + Job Queue abstraction   │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Worker Service — container/server runtime                     │
│                                                              │
│ MCP Client/Agent | Playwright MCP | Playwright Test Runner   │
│ Git checkout     | Report upload  | Evidence capture         │
│ Optional allowed runtime: CloakBrowser at Phase 08 only      │
└──────────────┬───────────────────────────────────────────────┘
               ▼
┌──────────────────────────────┐
│ Authorized Target Environment│
│ staging/UAT/domain allowlist │
└──────────────────────────────┘
```

### Quyết định quan trọng

- Next.js/Vercel là control plane: UI, metadata, workflow, AI text work.
- Worker là execution plane: browser, repo checkout, test runner, evidence nặng.
- Không cố chạy Playwright MCP/long regression job trong Vercel API route của MVP.

---

## 5. Component Responsibilities

## 5.1. Web UI Layer

| Component | Trách nhiệm |
|---|---|
| Dashboard | Hiển thị project/feature status và recent activities |
| Project/Feature Workspace | Điều hướng input, step output và action |
| Input Upload UI | Upload/paste input và metadata |
| Analysis/Clarification UI | Hiển thị structured output, nhận answer |
| Understanding UI | Confirm hoặc yêu cầu revision |
| Test Case Editor | Render/edit/filter/save/export TC |
| Model Selector | Chọn model cho step/run |
| Skill Reference View | Cho user biết skill/schema nào đang được dùng |

## 5.2. Application Services

| Service | Trách nhiệm |
|---|---|
| `ProjectService` | CRUD project |
| `FeatureService` | CRUD/status transition feature |
| `InputSourceService` | Upload, metadata, source retrieval |
| `WorkflowService` | Load workflow definition, validate step transition |
| `SkillLoaderService` | Load Markdown assets, metadata/version |
| `AIExecutionService` | Tạo request, gọi adapter, repair/validate output |
| `ArtifactService` | Version, persist và retrieve artifacts |
| `ClarificationService` | Lưu question/answer và trigger readiness re-evaluation |
| `TestCaseService` | Persist/edit/finalize testcase records |
| `ExcelExportService` | Generate `.xlsx` theo template |

## 5.3. Infrastructure Adapters

| Adapter | Trách nhiệm |
|---|---|
| `SupabaseDatabaseAdapter` | CRUD persistent records |
| `SupabaseStorageAdapter` | Private file upload/download/signed access |
| `ModelAdapter` | Interface gọi provider/model |
| `SkillFileAdapter` | Read files từ build/repository source |
| `GitMetadataAdapter` | Capture app/skill commit hash nếu deploy config cung cấp |

---

## 6. Clean Boundary đề xuất

```text
src/
├── app/                       # Route/page/layout; mỏng
├── components/                # Presentational/interaction components
├── features/                  # Feature modules theo domain
│   ├── projects/
│   ├── work-items/
│   ├── inputs/
│   ├── workflow-runs/
│   ├── clarifications/
│   ├── artifacts/
│   └── test-cases/
├── domain/                    # Entity/type/rules/state machine
├── application/               # Use cases/services
├── infrastructure/            # Supabase/model/file/git adapters
└── lib/                       # Utilities/config/schema
```

### Boundary rules

- Component chỉ gọi action/API/use-case; không chứa SQL/provider calls.
- Domain state transition không rải rác trong component.
- AI provider SDK chỉ tồn tại trong infrastructure/model adapter.
- DB table JSON shape không được leak tự do vào UI; map thành domain DTO.

---

## 7. AI Execution Pipeline

```text
User triggers current workflow step
  ↓
WorkflowService kiểm tra precondition của step
  ↓
SkillLoader đọc skill Markdown + output schema reference
  ↓
ContextBuilder lấy input/artifacts/answers cần thiết
  ↓
ModelAdapter gọi model được chọn
  ↓
ResponseParser trích JSON
  ↓
OutputValidator validate JSON Schema
  ├── Valid → ArtifactService save new version
  └── Invalid → Repair prompt có giới hạn → validate lại
                └── vẫn invalid → lưu failed run, UI báo lỗi
  ↓
Feature status chuyển theo rule workflow
```

### Không được bỏ qua

- Precondition gate.
- Schema validation.
- Artifact versioning.
- Model/skill traceability.

---

## 8. Model Adapter Design

```ts
interface ModelAdapter {
  providerId: string;
  executeStructuredTask(input: {
    modelId: string;
    systemInstructions: string;
    skillInstructions: string;
    context: unknown;
    outputSchema: object;
  }): Promise<ModelExecutionResult>;
}
```

### Adapter khả dụng

- `AnthropicAdapter` hoặc model provider trực tiếp nếu dùng Claude.
- `OpenAICompatibleAdapter` cho endpoint tương thích.
- `RouterAdapter` cho gateway được host và truy cập được.

### 9Router decision

9Router được mô tả là gateway local/OpenAI-compatible cho AI coding tools. Nếu platform deploy trên internet, không thể gọi endpoint `localhost` của máy developer. Vì vậy:

- MVP: ưu tiên model adapter gọi endpoint server-accessible.
- Nếu dùng 9Router: deploy 9Router ở server an toàn, quản lý secrets/network, rồi cấu hình platform trỏ tới endpoint đó.

---

## 9. Skill/Workflow Runtime Design

### Build-time/load-time strategy MVP

- `qa-core/` được commit cùng platform repo.
- Vercel deploy build chứa file Markdown mới nhất của commit.
- Backend load từ filesystem read-only ở runtime; không chỉnh skill trên UI.
- Artifact lưu `app_build_commit` hoặc `skill_revision` từ environment variable để trace.

### Lý do

- Gọn, review skill qua GitHub PR.
- Không cần DB skill registry/editor trong MVP.
- Dễ rollback bằng revert commit/deploy trước.

---

## 10. Persistence Architecture

| Dữ liệu | Source of truth |
|---|---|
| Source code, workflow, skill, schemas, templates | GitHub repository |
| Project, feature, step run, artifacts, testcase records | Supabase Postgres |
| Docs/Figma export/Excel/report/evidence | Private Supabase Storage |
| Temporary AI request memory | Request scope; không dựa vào filesystem |

Không dùng local SQLite cho deploy Vercel. SQLite chỉ có thể dùng cho spike local bị bỏ trước khi tích hợp persistence thật.

---

## 11. Deployment Topology

## 11.1. Local Development

```text
Developer machine
├── Next.js dev server
├── Supabase cloud project hoặc local Supabase
├── qa-core assets local
└── AI provider credentials via .env.local
```

## 11.2. MVP Deployment

```text
GitHub push
  ↓
Vercel deployment (Next.js web/control plane)
  ↕
Supabase cloud (database + storage)
  ↕
Model provider endpoint/server-accessible gateway
```

## 11.3. Future Execution Deployment

```text
Vercel web/control plane
  ↕
Persistent job records/queue
  ↕
Container Worker on appropriate host
  ├── Playwright MCP
  ├── Playwright Test
  ├── GitHub automation repo checkout
  └── Upload evidence/report to storage
```

---

## 12. Architecture Decision Records (ADRs) cần giữ

| ADR | Decision | Rationale |
|---|---|---|
| ADR-001 | Next.js full-stack for MVP | Một codebase, UI/API nhanh, phù hợp Vercel |
| ADR-002 | Supabase for DB + file storage | Gộp persistence/file đơn giản cho MVP |
| ADR-003 | Skill/workflow in Git Markdown | Team có thể chỉnh, review, version bằng Git |
| ADR-004 | JSON artifacts validated by schema | Model switch không phá format/dữ liệu |
| ADR-005 | No RBAC in initial MVP | Giảm scope; vẫn cần protect data thật |
| ADR-006 | Browser/test execution in external worker | Job nặng/long-running không phù hợp web request MVP |
| ADR-007 | CloakBrowser not core | Giữ product là QA platform; giảm misuse và scope |

---

## 13. Risks và Mitigation

| Risk | Mitigation |
|---|---|
| Output AI không ổn định | Schema, repair, examples, human confirm, evaluation |
| File nhạy cảm bị lộ | Private bucket, server access, login/access gate trước real data |
| Vercel plan không phù hợp team/commercial use | Kiểm tra terms; dùng plan/hosting phù hợp khi dùng cho công việc |
| Job AI chậm/time out | MVP xử lý step nhỏ; về sau job async/worker |
| Skill thay đổi làm output xấu hơn | Lưu commit, feedback, benchmark, rollback |
| Automation chạy sai domain | Domain allowlist và explicit environment policy ở phase automation |

---

## Architecture Addendum: Core Engine, Skills, Models, And Tools

QAFlow AI is a multi-workflow platform with a shared Requirement Understanding Layer. Manual QA, Automation QA, API QA, Performance QA, and Evaluation/History/Reports all consume or enrich the same understanding and artifact history.

Core Engine responsibilities:

- Workflow execution and step orchestration.
- Persistence, artifact versioning, history, and reporting.
- JSON/schema validation and runtime safety.
- Security, environment validation, access gates, and integration boundaries.
- UI surfaces that operate on workflow state and artifacts.

Custom Skill responsibilities:

- Requirement reading policy.
- Manual testcase format.
- Automation conventions and output profile.
- API QA rules and contract expectations.
- Performance QA/NFR interpretation rules.

Skills, schemas, and templates are Git-versioned `.md` / `.json` assets. They are product configuration and quality policy, not hard-coded infrastructure.

Phase 01B, Real Model Provider Integration & Verification, validates real Manual QA execution using real Supabase and real provider API keys. The model layer remains provider-agnostic. OpenAI-compatible adapters can support DeepSeek or compatible providers. Claude-native support is optional/future. Team and production modes must not fallback to mock output. Phase 01B does not use MCP.

MCP is a protocol for AI tool use; it is not a model and not an output framework. Browser access is behind `BrowserToolAdapter`. `PlaywrightMcpAdapter` is the first provider; `SeleniumMcpAdapter` is a future provider. Workflow definitions call browser-tool capabilities, not Playwright MCP directly. Exploration Tool selection and Automation Output Profile selection are independent.

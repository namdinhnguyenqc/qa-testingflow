# AI Workflow, Skills & Output Contract Specification

## 1. Mục tiêu

Đây là phần cốt lõi giúp QAFlow AI khác với chatbot AI thông thường:

```text
User Input + Workflow Step + Skill Markdown + Schema + Model
   → Structured Artifact chuẩn hóa, traceable, reviewable
```

Mọi model phải thực hiện cùng workflow, dùng cùng skill definition và trả output theo cùng contract.

---

## 2. Khái niệm nền tảng

| Khái niệm | Định nghĩa |
|---|---|
| Workflow | Chuỗi step nghiệp vụ để đạt một outcome, ví dụ Manual Test Design |
| Step | Đơn vị thực thi; có input, skill, schema, precondition và next condition |
| Skill | Quy tắc chuyên môn viết bằng Markdown để model làm đúng cách của team |
| Output Contract | Cấu trúc JSON mà step bắt buộc trả về |
| Artifact | Output đã validate và lưu theo version |
| Model Adapter | Lớp gọi Claude/Codex/OpenAI-compatible endpoint |
| Evaluation | Cách đo output/skill/model tốt hay chưa |

---

## 3. qa-core Directory Contract

```text
qa-core/
├── system/
│   ├── base-agent.md
│   └── artifact-rules.md
├── workflows/
│   └── manual-test-design.workflow.md
├── skills/
│   ├── common/
│   │   ├── source-intake.skill.md
│   │   ├── requirement-reader.skill.md
│   │   ├── gap-analysis.skill.md
│   │   └── clarification.skill.md
│   └── manual/
│       ├── readiness-evaluator.skill.md
│       ├── feature-understanding.skill.md
│       ├── testcase-generator.skill.md
│       └── testcase-reviewer.skill.md
├── schemas/
│   ├── requirement-analysis.schema.json
│   ├── clarification.schema.json
│   ├── readiness.schema.json
│   ├── feature-understanding.schema.json
│   └── manual-testcase.schema.json
├── templates/
│   └── testcase-columns.md
└── examples/
    └── approved/
```

MVP có thể load các file này từ filesystem của build; không cần màn hình edit skill.

---

## 4. Workflow Definition Contract

Một workflow Markdown phải mô tả tối thiểu:

- Key/name/version.
- Mục tiêu.
- Preconditions chung.
- Danh sách step theo thứ tự.
- Skill file dùng ở mỗi step.
- Required input artifact/source.
- Output schema key/version.
- Gate chuyển step.
- User confirmation point.
- Failure/retry behaviour.

### Manual Test Design Workflow

| Step key | Skill | Output | Gate |
|---|---|---|---|
| `source_intake` | Source Intake | Normalized sources summary | Có input tối thiểu |
| `requirement_analysis` | Requirement Reader | Requirement analysis artifact | Valid schema |
| `gap_analysis` | Gap Analysis | Missing/conflict classification | Nếu critical → clarification |
| `clarification` | Clarification | Questions | User answers/pending |
| `readiness_evaluation` | Readiness Evaluator | Ready/not ready | Ready required for understanding |
| `feature_understanding` | Feature Understanding | Summary | User confirm |
| `testcase_generation` | TC Generator | TC set | Understanding confirmed hoặc explicit draft-only |
| `testcase_review` | TC Reviewer | Review warnings | User resolves/saves final |
| `export` | Deterministic service | XLSX | Final/draft selected |

---

## 5. Skill Markdown Contract

Mỗi skill phải có các section sau:

```markdown
# Skill: [Name]

## Metadata
- Key:
- Version:
- Workflow types:
- Output schema:

## Role
AI đang đóng vai ai.

## Objective
Kết quả cần đạt của step này.

## Allowed Inputs
Danh sách artifact/source được phép sử dụng.

## Preconditions
Điều kiện bắt buộc trước khi thực thi.

## Processing Rules
Quy tắc phân tích/thực hiện.

## Forbidden Behaviours
Điều AI không được làm.

## Output Requirements
Field bắt buộc, semantics và schema.

## Quality Checklist
Checklist AI tự rà soát trước khi trả output.

## Examples (optional)
Golden examples ngắn hoặc reference.
```

### Nguyên tắc skill design

- Một skill tập trung một trách nhiệm.
- Không biến skill thành prompt tổng hợp làm toàn bộ workflow.
- Skill phải chỉ rõ khi nào phải dừng và hỏi lại.
- Examples phải là output đã được team chấp nhận, không chứa dữ liệu nhạy cảm.

---

## 6. Model Switch Contract

### Required invariants

Khi user switch model, hệ thống vẫn giữ nguyên:

- Workflow key và step.
- Skill file/revision.
- Input snapshot/reference.
- Output schema/version.
- Validation rule.
- UI render contract.

### Có thể thay đổi

- Nội dung reasoning/đề xuất chi tiết.
- Số câu hỏi clarification hợp lý.
- Coverage richness.
- Chất lượng văn phong.

### Không cho phép

- Model trả bảng/markdown tự do thay vì JSON contract và hệ thống coi là final.
- Model A tự tạo official testcase trong khi gate chưa pass chỉ vì model A “tự tin”.

---

## 7. Output Validation & Repair Cycle

```text
Model response
  ↓ Parse structured JSON
Schema valid?
  ├── Yes → semantic validation → save artifact
  └── No → repair attempt #1 with explicit schema errors
            ↓ valid?
            ├── Yes → save with validation_status=REPAIRED
            └── No → optional repair #2 / mark FAILED
```

### Schema validation

Kiểm tra structure/type/required enum.

### Semantic validation bổ sung

Ví dụ Manual TC:

- `expected_result` không được rỗng hoặc là “hoạt động đúng”.
- Official test case không tham chiếu assumption critical chưa resolved.
- Test Case ID không trùng trong một artifact.
- Feature Understanding official phải có confirmed rules hoặc xác nhận không có rule phù hợp.

### Repair policy

- Giới hạn 1–2 lần repair để kiểm soát chi phí/vòng lặp.
- Lưu validation errors và repair count trong `step_runs`.
- Không hiển thị output invalid như artifact chính thức.

---

## 8. Output Contracts — Functional Semantics

## 8.1. Requirement Analysis

Các nhóm dữ liệu:

| Field group | Ý nghĩa |
|---|---|
| Confirmed | Có nguồn dẫn chứng rõ |
| Missing critical | Thiếu và ảnh hưởng expected result |
| Missing non-critical | Thiếu nhưng không block functional TC |
| Conflicts | Hai nguồn mô tả khác nhau |
| Assumptions | Suy luận chưa được user xác nhận |
| Source mapping | Source nào chứng minh nội dung nào |

## 8.2. Clarification Questions

Mỗi question phải có:

- `question_id`.
- `category`.
- `question`.
- `reason_required`.
- `is_critical`.
- `related_sources`.
- `answer_status`.

## 8.3. Feature Understanding

Chỉ đánh dấu `ready_for_official_testcases = true` khi:

- Goal/main flow đã rõ.
- Critical business rules/validations/state/error relevant đã được resolved hoặc confirmed not applicable.
- Không còn conflict critical chưa xử lý.

## 8.4. Manual Testcase Set

Mỗi case phải gồm:

- ID/module/scenario/type/priority.
- Preconditions.
- Steps.
- Test data.
- Expected result.
- Automation candidate.
- Requirement mapping.
- Assumptions (chỉ cho draft).

---

## 9. Skill “Training” Strategy

Trong giai đoạn đầu, “train skill” nghĩa là cải thiện rule/examples/evaluator chứ không fine-tune model.

### Dữ liệu cần lưu

| Data | Mục đích |
|---|---|
| AI output ban đầu | Biết model đã sinh gì |
| Final edited artifact | Biết output chấp nhận là gì |
| Model + skill revision | So sánh chính xác |
| User rating/feedback | Biết lỗi thường gặp |
| Validation errors | Cải thiện prompt/schema |

### Improvement loop

```text
Collect outputs & edits
  ↓
Identify repeated quality gaps
  ↓
Update skill.md / examples / semantic validator
  ↓
Commit new revision
  ↓
Run benchmark inputs with old/new skill and models
  ↓
Activate/deploy improved revision
```

### Không làm sớm

- Fine-tune khi chưa có dataset approved đủ lớn.
- Auto thay skill production mà không review/benchmark.

---

## 10. Evaluation Framework — Phase 02

| Metric | Definition |
|---|---|
| Schema pass rate | % run pass output schema không cần repair |
| Repair success rate | % invalid output được sửa thành valid |
| Approval without edit | % artifact được chấp nhận không sửa |
| Edit distance / cell edit count | Mức sửa testcase thực tế |
| Missing coverage feedback | Loại case thường bị user bổ sung |
| Clarification usefulness | Câu hỏi đúng/không dư theo feedback |
| Model comparison | Cùng input + cùng skill, model nào tốt hơn |

---

## 11. Tool Permissions theo phase

| Phase/Skill | Được phép dùng | Không được phép |
|---|---|---|
| Manual MVP | Input text/files, model API, schema validator | Browser, code repo writing, test execution |
| UI Exploration | Authorized URL, Playwright MCP snapshot | Mutating production, unapproved domains |
| Automation | Test repo branch/diff, Playwright runner | Product source modification, merge main tự động |
| Performance | Approved target/load runner | Run tải khi chưa approval |
| Anti-bot | Authorized sandbox only | Bypass bên thứ ba/target ngoài scope |

---

## Skill Boundary Addendum

QAFlow AI separates the Core Engine from Custom Skill assets.

Core Engine:

- Executes workflows.
- Persists inputs, runs, artifacts, feedback, and reports.
- Validates output schemas.
- Enforces runtime safety and access boundaries.
- Integrates model and tool adapters.

Custom Skills/Schemas/Templates:

- `.md` skills define how requirements are read and how QA reasoning is performed.
- `.json` schemas define output contracts.
- Templates define testcase, automation, API, or performance output formats.
- Git history is the versioning and review mechanism.

Skill files can define Manual QA conventions, automation POM conventions, API testcase rules, and performance/NFR interpretation. Core code should not hard-code those team-specific conventions.

MCP/tool use is orthogonal to model selection and output contract selection. A workflow may use browser exploration through `BrowserToolAdapter`, while automation output remains controlled by an Automation Output Profile.

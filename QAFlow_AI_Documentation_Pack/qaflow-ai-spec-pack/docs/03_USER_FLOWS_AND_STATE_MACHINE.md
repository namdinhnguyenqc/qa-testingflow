# User Flows & State Machine — QAFlow AI

## 1. Nguyên tắc flow

Hệ thống không phải chat AI tự do. Mỗi feature đi qua các step có checkpoint, artifact và điều kiện chuyển trạng thái. User luôn biết:

- Đang ở bước nào.
- AI đang dùng skill/model nào.
- Cần cung cấp gì tiếp.
- Output nào đã được confirm/final.

---

## 2. Main Flow — Manual Test Design MVP

```text
[Project List]
  ↓ Create/Open Project
[Project Detail]
  ↓ New Feature
[Feature Setup]
  - Name
  - Manual Workflow
  - Selected Model
  - Input upload/paste
  ↓ Start Analysis
[Requirement Analysis]
  - Confirmed facts
  - Missing rules
  - Conflicts
  - Assumptions
  ├── Có critical missing → [Clarification]
  │       ↓ User answers
  │   [Readiness Re-evaluation]
  │       ├── Chưa đủ → [Clarification tiếp]
  │       └── Đủ → [Feature Understanding]
  └── Đủ ngay → [Feature Understanding]
          ↓ User confirms
[Test Case Generation]
  ↓
[Test Case Editor]
  - Filter/edit/add/delete
  - Save Final
  - Export Excel
  ↓
[Completed / Available for future automation]
```

---

## 3. Feature State Machine — MVP

| State | Ý nghĩa | Entry condition | Allowed user actions | Exit |
|---|---|---|---|---|
| `DRAFT` | Feature vừa tạo | Record tạo thành công | Upload input, edit setup | `INPUT_READY` |
| `INPUT_READY` | Có input tối thiểu | Requirement/note hợp lệ | Start Analysis | `ANALYZING` |
| `ANALYZING` | AI đang phân tích | User run analysis | View progress/cancel nếu hỗ trợ | `NEEDS_CLARIFICATION` hoặc `READY_FOR_UNDERSTANDING` hoặc `FAILED` |
| `NEEDS_CLARIFICATION` | Thiếu rule critical | Analysis trả câu hỏi blocking | Answer, rerun, draft-only | `ANALYZING`/`READY_FOR_UNDERSTANDING` |
| `READY_FOR_UNDERSTANDING` | Đủ thông tin tạo summary | Readiness pass | Generate/view understanding | `UNDERSTANDING_REVIEW` |
| `UNDERSTANDING_REVIEW` | Chờ user confirm | Summary generated | Confirm/revise/clarify | `UNDERSTANDING_CONFIRMED` hoặc `NEEDS_CLARIFICATION` |
| `UNDERSTANDING_CONFIRMED` | Source-of-truth đã chốt | User confirm | Generate official TC | `TESTCASE_GENERATING` |
| `TESTCASE_GENERATING` | AI đang viết TC | Trigger generate | View progress | `TESTCASE_DRAFTED` hoặc `FAILED` |
| `TESTCASE_DRAFTED` | Có TC để review | Valid artifact saved | Edit/add/delete/review/export draft | `COMPLETED` khi save final |
| `COMPLETED` | Final TC saved | User save final | Export, rerun version mới, future automation | giữ hoặc tạo version mới |
| `FAILED` | Step bị lỗi | Provider/schema/system error | Retry/change model/report | state phù hợp trước đó |

### Draft-with-assumptions ngoại lệ

Khi ở `NEEDS_CLARIFICATION`, user có thể yêu cầu tạo Draft TC. Artifact bắt buộc có:

- `status = DRAFT_WITH_ASSUMPTIONS`.
- Danh sách critical assumptions chưa confirm.
- Cảnh báo không được dùng làm source automation chính thức.

---

## 4. Workflow Step State

Mỗi AI step run có trạng thái riêng:

```text
QUEUED → RUNNING → VALIDATING → COMPLETED
                    ├── REPAIRING → VALIDATING → COMPLETED
                    └── FAILED
```

| State | UI cần hiển thị |
|---|---|
| Queued/Running | Loading và tên step/model/skill |
| Validating | “Đang kiểm tra cấu trúc kết quả” |
| Repairing | “Kết quả chưa đúng format, đang chuẩn hóa lại” |
| Completed | Artifact + metadata |
| Failed | Lỗi có thể hiểu được + Retry/Switch model |

---

## 5. Input Intake Flow

```text
User tạo Feature
  ↓
Upload/paste input
  ↓
System validate file type/size/name
  ↓
Upload private storage
  ↓
Save input metadata DB
  ↓
Show source list + status usable/not parsed/reference-only
```

### Input status

| Status | Ý nghĩa |
|---|---|
| `UPLOADED` | File lưu thành công |
| `TEXT_AVAILABLE` | Có text đưa vào AI context |
| `REFERENCE_ONLY` | Ví dụ Figma URL chưa tích hợp fetch |
| `PARSE_FAILED` | Không extract được; user cần paste/export khác |
| `REMOVED` | Ẩn khỏi future analysis, không hard delete ngay nếu cần audit |

---

## 6. Clarification Loop chi tiết

```text
Requirement Analysis Artifact
  ↓
Critical gap detected?
  ├── No → Generate Understanding
  └── Yes
       ↓
  AI tạo questions có category/critical/reason/source
       ↓
  User answers / marks pending
       ↓
  Re-evaluate using original input + prior analysis + answers
       ↓
  Remaining critical gap?
       ├── Yes → generate next questions or request explicit assumption handling
       └── No → create Understanding Summary
```

### Question display requirements

Mỗi câu hỏi hiển thị:

- Nội dung câu hỏi.
- Nhóm: business rule / validation / permission / state / error / UI conflict.
- Tại sao cần trả lời.
- Source dẫn tới câu hỏi nếu có.
- Critical badge.
- Answer field và trạng thái answered/pending.

---

## 7. Model Switch Flow

```text
User đang tại step có thể chạy/rerun
  ↓
Chọn Model A hoặc Model B
  ↓
Run mới tạo `step_run` mới
  ↓
Cùng skill + cùng schema + cùng input snapshot/reference
  ↓
Output mới được lưu version độc lập
  ↓
User chọn output nào để tiếp tục/confirm
```

### Rules

- Switch model không thay đổi existing confirmed artifact trừ khi user confirm version mới.
- Không overwrite output model trước.
- UI hiển thị rõ model + timestamp + skill revision của mỗi version.

---

## 8. Test Case Review Flow

```text
Generated TC artifact
  ↓
Render editable table
  ↓
User filters/reviews
  ├── Inline edit cells
  ├── Add manual case
  ├── Delete/unselect case
  ├── Regenerate selected scenarios (version mới)
  └── Save Final Version
       ↓
Export Excel
```

### Audit-lite requirements

Dù không có RBAC, hệ thống vẫn phải giữ:

- AI generated initial dataset.
- Final edited dataset.
- Generated/export timestamps.
- Model và skill tạo bản ban đầu.

---

## 9. Error & Recovery Flows

| Tình huống | UX mong muốn |
|---|---|
| Upload file thất bại | Báo lỗi rõ, cho upload lại, không tạo metadata giả |
| File không parse được | Lưu file nhưng đánh dấu parse failed; hướng dẫn paste text/export PDF khác |
| AI provider lỗi/timeout | Step failed; giữ input; cho retry/switch model |
| AI output sai schema | Auto repair giới hạn; nếu vẫn fail hiển thị lỗi và không chuyển state |
| User reload giữa run | Lấy trạng thái run mới nhất từ DB; không mất output đã hoàn tất |
| Export Excel lỗi | Testcase final không mất; cho retry download |

---

## 10. Future Flow — UI Exploration/MCP

```text
Approved/ongoing Feature Analysis
  ↓
User cấu hình staging URL + allowed domain
  ↓
Create UI exploration job
  ↓
Worker dùng Playwright MCP lấy structured UI snapshot
  ↓
AI so sánh Docs/Figma/UI
  ↓
Mismatch/validation discovered → clarification bổ sung
```

## 11. Future Flow — Automation POM

```text
Final Approved Test Cases
  ↓
Select automation candidates
  ↓
Load automation repo convention + POM skill
  ↓
MCP explore locator / Agent generate code proposal
  ↓
Run validation in worker
  ↓
Show code diff + evidence
  ↓
User manually approves/pushes or creates PR
```

## 12. Future Flow — Regression & CI/CD

```text
New build deployed / manual trigger
  ↓
Run approved suite in worker/GitHub Actions
  ↓
Persist results/evidence
  ↓
AI failure classification
  ↓
Dashboard + export/share report
```

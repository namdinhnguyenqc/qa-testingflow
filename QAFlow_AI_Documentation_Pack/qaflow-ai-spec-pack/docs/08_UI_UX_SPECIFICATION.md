# UI/UX Specification — QAFlow AI MVP

## 1. UX objective

Tester phải cảm nhận đây là một quy trình làm việc rõ ràng, không phải hộp chat mơ hồ. UI ưu tiên:

- Nhìn thấy feature đang ở bước nào.
- Nhìn thấy điều gì đã rõ và điều gì đang block.
- Dễ trả lời câu hỏi, review và sửa test case.
- Không sợ mất kết quả khi regenerate hoặc đổi model.

---

## 2. Information Architecture

```text
Dashboard
└── Projects
    └── Project Detail
        └── Feature Workspace
            ├── Overview / Status
            ├── Inputs
            ├── Analysis
            ├── Clarification
            ├── Understanding
            ├── Test Cases
            └── History / Exports
```

Không cần menu Skills editor trong MVP; chỉ hiển thị skill đang dùng/reference.

---

## 3. Global Layout

### Desktop MVP

```text
┌──────────────────────────────────────────────────────────────┐
│ Header: QAFlow AI | Project breadcrumb | Model | Settings     │
├──────────────┬───────────────────────────────────────────────┤
│ Sidebar      │ Main Content                                   │
│ Dashboard    │                                               │
│ Projects     │                                               │
│ Recent       │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

### Design principles

- Nội dung chính rộng, đặc biệt cho testcase table.
- Status badge dùng nhất quán.
- Critical item nổi bật nhưng không gây rối.
- Không dùng chat-only layout cho toàn bộ feature; chat chỉ là một phần của clarification.

---

## 4. Screen Specification

## 4.1. Dashboard

### Nội dung

- Tổng số project/feature.
- Feature đang cần clarification.
- Feature đã hoàn thành TC.
- Recent features.
- CTA `Create Project` / `New Feature`.

### Empty state

```text
Chưa có project nào.
Tạo project đầu tiên để phân tích requirement và sinh testcase bằng workflow AI.
[Create Project]
```

---

## 4.2. Project Detail

### Nội dung

- Project name/description/default model.
- Danh sách feature.
- Filter status.
- Button `New Feature`.

### Table columns

| Feature | Workflow | Current Step | Status | Model | Updated | Action |

---

## 4.3. New Feature / Setup

### Fields

| Field | Type | Validation |
|---|---|---|
| Feature name | Text | Required |
| Description | Textarea | Optional |
| Workflow | Select | MVP fixed/selected `Manual Test Design` |
| Model | Select | Required/default |
| Requirement text | Textarea | Required nếu không upload document |
| File upload | Multi upload | Validate extension/size |
| Figma reference | Link/text or upload image/PDF | Optional |

### CTA

- `Save Draft`.
- `Save & Start Analysis` — disabled nếu chưa có input tối thiểu.

---

## 4.4. Feature Workspace Shell

### Header

- Feature name.
- Status badge.
- Workflow.
- Current selected model dropdown.
- Last updated.

### Stepper

```text
Inputs → Analysis → Clarification → Understanding → Test Cases → Export
```

- Step chưa available disabled.
- Step hoàn tất có check mark.
- Step blocking hiện badge action needed.

---

## 4.5. Inputs Tab

### Nội dung

- Danh sách file/reference/pasted text.
- Status file: Uploaded/Text Available/Reference Only/Parse Failed.
- Add new source.
- Remove/exclude source from next run.

### UX rules

- Cho user biết Figma link chỉ là reference nếu chưa tích hợp đọc trực tiếp.
- Không giả vờ AI đã đọc file parse failed.

---

## 4.6. Analysis Tab

### Layout

```text
┌──────────────────────┬──────────────────────────────────────┐
│ Sources Used          │ Analysis Result                       │
│ Model / Skill info    │ Feature Goal                          │
│ Previous versions     │ Confirmed / Missing / Conflicts       │
│                      │ Assumptions / Suggested next action   │
└──────────────────────┴──────────────────────────────────────┘
```

### Actions

- `Run Analysis` / `Run Again`.
- `Switch Model & Rerun`.
- `Continue to Clarification` nếu critical gaps.
- `Generate Understanding` nếu ready.

---

## 4.7. Clarification Tab

### Question card

```text
[Critical] Business Rule
Phòng không có khách thuê ở kỳ được chọn có được tạo hóa đơn không?
Why needed: Quyết định expected result cho case tạo hóa đơn phòng trống.
Source: Requirement không đề cập; Figma cho phép chọn phòng.

Answer: [ textarea ]  [Mark Pending]
```

### Actions

- Save answers draft.
- Submit answers & Re-evaluate.
- Generate Draft TC with assumptions (cảnh báo rõ).

---

## 4.8. Understanding Tab

### Sections

- Goal.
- Actors/permissions relevant.
- Preconditions.
- Main flow.
- Business rules.
- Validations.
- State transitions.
- Error handling.
- Remaining assumptions.
- Source/clarification trace.

### CTA

- `Confirm Understanding & Continue`.
- `Request Revision`.
- `Back to Clarification`.

Confirmation phải có modal nhắc: summary này sẽ là nguồn để sinh official testcase.

---

## 4.9. Test Cases Tab

### Toolbar

- Artifact version selector.
- Filters: Type/Priority/Automation Candidate/Status.
- Search scenario.
- `AI Review Coverage` optional trong Phase 01.
- `Save Final Version`.
- `Export Excel`.

### Editable table columns

| ID | Module | Scenario | Type | Priority | Preconditions | Steps | Data | Expected | Auto? | Mapping | Status |

### Editing UX

- Nội dung dài mở drawer/modal để edit dễ hơn.
- Dirty state indicator khi có thay đổi chưa save.
- Không overwrite generated version; Save Final tạo final artifact/version.

---

## 4.10. History Tab

### Nội dung

- Timeline step runs.
- Model/skill/schema/validation status.
- Artifact versions.
- Export file history.

### Giá trị UX

User hiểu vì sao kết quả thay đổi sau khi switch model/sửa skill.

---

## 5. Status Presentation

| Status | Label hiển thị | User meaning |
|---|---|---|
| `DRAFT` | Draft | Chưa có input đủ |
| `INPUT_READY` | Ready to Analyze | Có thể bắt đầu |
| `ANALYZING` | Analyzing | AI đang chạy |
| `NEEDS_CLARIFICATION` | Action Required | Cần trả lời câu hỏi |
| `UNDERSTANDING_REVIEW` | Review Understanding | Cần confirm |
| `UNDERSTANDING_CONFIRMED` | Ready for Test Cases | Có thể sinh TC |
| `TESTCASE_DRAFTED` | Review Test Cases | Chỉnh/saving final |
| `COMPLETED` | Completed | TC final/export sẵn |
| `FAILED` | Failed | Retry hoặc switch model |

---

## 6. Accessibility & Usability Baseline

- Button/input có label rõ.
- Keyboard navigation hoạt động cho form/table cơ bản.
- Không chỉ dùng màu để biểu thị critical/status; có text/icon.
- Error message gần input hoặc action gây lỗi.
- Table lớn hỗ trợ horizontal scroll hợp lý.
- Loading không làm user nghi ngờ đã mất input.

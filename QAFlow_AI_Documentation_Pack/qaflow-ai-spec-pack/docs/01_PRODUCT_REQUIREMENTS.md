# Product Requirements Document (PRD) — QAFlow AI

| Thuộc tính | Giá trị |
|---|---|
| Product | QAFlow AI — AI QA Workflow & Skill Platform |
| Trạng thái tài liệu | Implementation baseline |
| Product owner mục tiêu | Người xây dựng / QA owner |
| Người dùng mục tiêu | Tester, automation tester, người review test design |
| MVP trọng tâm | Manual Test Design từ Docs/Figma với clarification loop |

---

## 1. Product Vision

Xây dựng một website để team tester sử dụng AI theo **quy trình QA chuẩn hóa**, thay vì prompt tự do. Hệ thống phải cho phép thay model, thay skill, tái sử dụng output và lưu lại toàn bộ quá trình phân tích.

> QAFlow AI biến tài liệu đầu vào không hoàn chỉnh thành test artifact có thể review được: AI phân tích → hỏi lại → chốt understanding → sinh test case đúng format → mở rộng sang automation/regression.

---

## 2. Problem Statement

### 2.1. Vấn đề hiện tại

| Pain point | Tác động thực tế |
|---|---|
| Requirement và Figma không luôn đầy đủ business rule | Tester phải đoán hoặc hỏi thủ công, test case dễ sai expected result |
| Test case phụ thuộc năng lực cá nhân | Coverage không đồng nhất giữa các thành viên |
| AI chat thông thường trả format không ổn định | Không thể lưu, export, so sánh hoặc dùng làm input automation đáng tin cậy |
| Automation thường viết sau khi scope chưa chốt | Tốn effort sửa script và phân loại false failure |
| Kiến thức của senior QA không đóng gói thành quy trình | Team khó scale và cải thiện chất lượng có hệ thống |

### 2.2. Cơ hội

- Đóng gói tư duy senior QA vào `skill.md` và `workflow.md`.
- Ép mọi model tạo output cùng schema.
- Lưu output ban đầu và bản user sửa để nâng cấp skill theo dữ liệu thực tế.
- Tạo nền tảng mở rộng từ Manual → Automation → Regression → API/Performance.

---

## 3. Product Goals và Non-goals

### 3.1. Goals của MVP

1. Cho phép tạo project và feature cần kiểm thử.
2. Nhận input từ requirement text/file và Figma screenshot/PDF export.
3. Chạy Manual QA workflow sử dụng skill Markdown.
4. Phát hiện điểm thiếu/mâu thuẫn và đặt câu hỏi clarification critical.
5. Không sinh official test case trước khi user confirm Feature Understanding.
6. Sinh test case đúng cấu trúc team và xuất Excel.
7. Cho phép switch model nhưng UI/output contract không đổi.
8. Lưu được input, run history, artifact, testcase và file export để xem lại.

### 3.2. Non-goals của MVP

- Không cần phân quyền Admin/Lead/Tester chi tiết.
- Không cần tích hợp trực tiếp Figma API/private OAuth.
- Không chạy browser/MCP/automation thật.
- Không trigger CI/CD/regression.
- Không chạy performance test.
- Không tích hợp CloakBrowser.
- Không làm skill editor phức tạp trên web; skill chỉnh bằng Markdown trong GitHub.

---

## 4. Product Principles

| Nguyên tắc | Ý nghĩa triển khai |
|---|---|
| Understand before generate | Phải có clarification và understanding gate trước official TC |
| Structured over free text | Artifact nghiệp vụ lưu JSON chuẩn; UI/Excel render từ JSON |
| Skill over prompt improvisation | Quy tắc của team nằm ở skill versioned trong repo |
| Model-agnostic | Claude/Codex/model khác đều bị ràng buộc bởi cùng workflow/schema |
| Human-confirmed critical output | User xác nhận understanding và final TC |
| Traceable decisions | Lưu input, model, skill, output và user edit |
| Build foundation first | Không nhảy sang automation khi manual workflow chưa ổn |

---

## 5. Người dùng và nhu cầu

> MVP không cần hệ thống role/permission, nhưng cần hiểu ai sẽ thao tác sản phẩm.

| Persona | Nhu cầu |
|---|---|
| Manual Tester | Upload requirement/Figma, trả lời câu hỏi, chỉnh sửa và export TC |
| Senior Tester / Reviewer | Kiểm tra rule, coverage, sửa output, cải thiện skill Markdown |
| Automation Tester (sau MVP) | Nhận approved TC, sinh code POM, chạy validate và đưa vào regression |
| Product Builder | Cấu hình model, sửa skill/workflow qua GitHub, xem chất lượng output |

---

## 6. End-to-End MVP Journey

```text
Tạo Project
  ↓
Tạo Feature + chọn Manual Workflow + chọn Model
  ↓
Upload Docs/Figma hoặc paste requirement
  ↓
AI phân tích input bằng Requirement Reader Skill
  ↓
Hiển thị: Confirmed / Missing / Conflicts / Assumptions
  ↓
Nếu thiếu critical rule → Clarification Questions
  ↓
User trả lời → AI đánh giá lại readiness
  ↓
AI tạo Feature Understanding Summary
  ↓
User Confirm Understanding
  ↓
AI sinh Test Cases theo template/schema team
  ↓
User edit/save final → Export Excel
  ↓
Lưu history cho việc cải thiện skill và automation về sau
```

---

## 7. Functional Modules — MVP

## 7.1. Project Management

### Mục tiêu

Nhóm các feature theo một sản phẩm hoặc dự án QA.

| ID | Functional requirement | Acceptance intent |
|---|---|---|
| PRJ-001 | Tạo project | User nhập tên; hệ thống lưu và mở project detail |
| PRJ-002 | Hiển thị project list | Có tên, số feature, trạng thái cập nhật gần nhất |
| PRJ-003 | Sửa project | Sửa tên, mô tả, default model |
| PRJ-004 | Xóa project có xác nhận | Không xóa nhầm; định nghĩa xử lý dữ liệu con trước khi code |

### Dữ liệu tối thiểu

- Name — bắt buộc.
- Description — không bắt buộc.
- Default model — tùy chọn.
- Created/updated timestamps.

---

## 7.2. Feature Workspace

### Mục tiêu

Một feature là nơi lưu toàn bộ nguồn input, AI run, clarification, understanding và testcase.

| ID | Functional requirement |
|---|---|
| FEAT-001 | Tạo feature dưới project |
| FEAT-002 | Chọn workflow `manual_test_design` |
| FEAT-003 | Chọn model mặc định của feature |
| FEAT-004 | Hiển thị status hiện tại |
| FEAT-005 | Xem lại input, artifacts và history |
| FEAT-006 | Không mất dữ liệu sau refresh/redeploy |

### Feature lifecycle MVP

```text
DRAFT → INPUT_READY → ANALYZING → NEEDS_CLARIFICATION
      → READY_FOR_UNDERSTANDING → UNDERSTANDING_CONFIRMED
      → TESTCASE_DRAFTED → COMPLETED
```

---

## 7.3. Input Source Manager

### Supported inputs MVP

| Source type | Hỗ trợ MVP | Ghi chú |
|---|---:|---|
| Pasted requirement text | Có | Input dễ nhất để khởi động |
| Markdown/TXT requirement file | Có | Có thể đọc text trực tiếp |
| PDF/DOCX requirement | Có theo implementation milestone | Text extraction cần validate |
| Figma screenshot/image | Có | Model multimodal hoặc lưu tham chiếu cho user |
| Figma PDF export | Có | Không cần private API integration |
| Figma private link | Chỉ lưu reference | Không tự truy cập trong MVP |
| API docs/Swagger | Upload/reference optional | Sử dụng đầy đủ ở API phase |
| Staging URL | Lưu metadata optional | Chưa browse trong MVP |

### Rules

- Feature phải có tối thiểu requirement text/file hoặc mô tả user trước khi analysis.
- File lưu private storage; DB lưu metadata.
- Upload mới không overwrite file cũ.
- Phải hiển thị nguồn nào AI đã sử dụng để phân tích.

---

## 7.4. Model Selection và AI Run

### Requirements

| ID | Requirement |
|---|---|
| MOD-001 | Cho user chọn model/provider trước khi chạy step |
| MOD-002 | Backend gọi model qua Model Adapter abstraction |
| MOD-003 | Mỗi run lưu model ID/provider, skill reference, input snapshot, output/validation |
| MOD-004 | User có thể rerun step bằng model khác mà không overwrite artifact cũ |
| MOD-005 | Output không hợp schema không được coi là successful artifact |

### Product rule

Model switch chỉ thay đổi engine; không được thay đổi field/flow của sản phẩm.

---

## 7.5. Requirement Analysis

### Mục tiêu

AI đóng vai Senior QA Analyst, đọc input và xác định thông tin đã rõ/chưa rõ/mâu thuẫn trước khi viết testcase.

### Output bắt buộc

- Feature goal.
- Actors/user roles được nhắc trong tài liệu.
- Screens/components tìm thấy.
- Preconditions.
- Main flow và alternative/exception flow nếu có.
- Fields và validations tìm thấy.
- Business rules tìm thấy.
- Permission/state/error handling tìm thấy.
- Missing critical information.
- Conflicts giữa sources.
- Assumptions chưa xác nhận.
- Source mapping.

### Rules

- AI không được tự coi assumption là confirmed rule.
- Nếu có critical missing item, feature phải chuyển `NEEDS_CLARIFICATION`.
- Không sinh official TC tại bước này.

---

## 7.6. Clarification Center

### Mục tiêu

Tập trung câu hỏi cần người biết nghiệp vụ trả lời trước khi test design.

| ID | Requirement |
|---|---|
| CLR-001 | Hiển thị danh sách câu hỏi AI sinh theo category |
| CLR-002 | Đánh dấu critical/non-critical |
| CLR-003 | Cho nhập câu trả lời hoặc chọn Pending/Unknown |
| CLR-004 | Submit answers để AI re-evaluate readiness |
| CLR-005 | Lưu lịch sử hỏi đáp và không mất câu trả lời cũ |

### Critical categories

- Business rule quyết định pass/fail.
- Required/validation/boundary quan trọng.
- State transition sau submit.
- Permission khi feature có phân quyền.
- Duplicate/idempotency rule.
- Error handling chính.

### Rule dừng

Nếu critical question còn unanswered, user chỉ được tạo **Draft TC with assumptions**, không được tạo official/final TC.

---

## 7.7. Feature Understanding Confirmation

### Mục tiêu

Tạo source-of-truth đã được user xác nhận cho việc viết TC.

### Nội dung artifact

- Goal.
- Actor và quyền liên quan.
- Preconditions.
- Main/alternative/exception flows.
- Confirmed business rules.
- Validation rules.
- State transition.
- Error handling.
- UI notes/conflicts đã resolve.
- Remaining non-critical assumptions.
- Source references và clarification decisions.

### Actions

| Action | Kết quả |
|---|---|
| Confirm | Cho phép official testcase generation |
| Request Revision | Tạo version understanding mới |
| Continue Clarification | Trở lại câu hỏi |
| Generate Draft Only | TC mang label assumptions/not approved |

---

## 7.8. Test Case Generation & Editor

### Test case columns chuẩn ban đầu

| Field | Bắt buộc |
|---|---:|
| Test Case ID | Có |
| Module | Có |
| Test Scenario | Có |
| Case Type | Có |
| Priority | Có |
| Preconditions | Có |
| Test Steps | Có |
| Test Data | Có |
| Expected Result | Có |
| Automation Candidate | Có |
| Requirement Mapping | Có |
| Status | Có |

### Case types hỗ trợ

- Happy.
- Validation.
- Negative.
- Boundary.
- Permission nếu áp dụng.
- UI/consistency nếu có Figma.
- Error Handling nếu rule đã rõ.
- Regression Candidate marker.

### Rules

- Official TC chỉ dùng confirmed understanding.
- Mỗi TC tập trung một mục tiêu chính.
- Expected result phải verify được.
- User sửa inline, thêm/xóa case và lưu final version.
- AI output ban đầu và final version đều phải lưu để đo chất lượng.

---

## 7.9. Excel Export

| ID | Requirement |
|---|---|
| EXP-001 | Export final/draft TC thành `.xlsx` |
| EXP-002 | Cột theo team template trong `qa-core/templates/` |
| EXP-003 | File có metadata project/feature/version/model ở sheet hoặc header cấu hình |
| EXP-004 | Export không làm đổi dữ liệu testcase trong DB |
| EXP-005 | Cho download trực tiếp; lưu file export optional theo config |

---

## 7.10. Artifact & Run History

### Artifact cần lưu

- Requirement analysis.
- Clarification questions/answers.
- Readiness evaluation.
- Feature understanding versions.
- Generated test case set.
- User-edited/final testcase set.
- Excel export metadata.

### Traceability bắt buộc

Mỗi AI artifact phải gắn:

- Feature.
- Workflow step.
- Model/provider.
- Skill file/path và skill revision/build commit nếu có.
- Schema version.
- Input snapshot hoặc reference.
- Created time.
- Validation result.

---

## 8. Future Modules — ngoài MVP nhưng kiến trúc phải hỗ trợ

| Module | Giá trị |
|---|---|
| Skill evaluation/model comparison | So sánh Claude/Codex theo approved output và edit rate |
| Playwright MCP UI exploration | Đọc UI staging thật và phát hiện mismatch với Docs/Figma |
| Automation generator | Generate Playwright TypeScript tuân POM |
| Regression Hub | Chạy suite, evidence, CI/CD trigger, AI failure analysis |
| API testing | API contract → API TC/code/run |
| Performance testing | NFR/SLA → k6 plan/script/report |
| Anti-bot optional runtime | Runtime được cấp phép cho anti-bot sandbox |

---

## 9. Success Metrics

### MVP product metrics

| Metric | Cách đo |
|---|---|
| Feature hoàn thành workflow | % feature từ input tới testcase export |
| Clarification usefulness | % câu hỏi user đánh giá cần thiết/đúng vấn đề |
| TC format compliance | % output pass schema ngay hoặc sau 1 repair |
| Edit rate | Số cell/TC user phải sửa trước final |
| Time saved | Thời gian manual tạo TC trước/sau dùng app |
| Skill improvement | Giảm edit/reject rate theo skill commit |

### Quality guardrails

- Không có official TC sinh từ understanding chưa confirm.
- Không mất dữ liệu do deploy lại website.
- Không lộ provider key/storage private file trong frontend.

---

## 10. Release Criteria cho MVP

MVP chỉ nên đưa team dùng thử khi:

- Feature flows chính đã pass E2E test.
- Data persistence đã verify qua redeploy/reload.
- File upload/private access được kiểm tra.
- AI output schema validation và lỗi repair hoạt động.
- Excel export kiểm tra đúng columns/sample.
- Có dữ liệu demo, không cần đưa tài liệu nhạy cảm vào môi trường chưa có access gate.

---

## Platform Scope Addendum

QAFlow AI is a multi-workflow QA platform. A shared Requirement Understanding Layer supports Manual QA, Automation QA, API QA, Performance QA, and shared Evaluation/History/Reports.

The Manual QA MVP is the first workflow, not the final product boundary. Later workflows reuse source intake, clarification, confirmed understanding, artifact versioning, evaluation, and reporting.

The Core Engine owns workflow execution, persistence, validation, security, UI, and integration boundaries. Custom team behavior belongs in Git-versioned skills, schemas, and templates. Skills define requirement reading rules, testcase formats, automation conventions, and API/performance QA rules.

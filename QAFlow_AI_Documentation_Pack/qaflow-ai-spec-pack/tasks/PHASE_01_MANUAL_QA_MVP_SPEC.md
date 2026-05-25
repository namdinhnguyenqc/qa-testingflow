# Phase 01 Specification — Manual QA Workflow MVP

## 1. Mục tiêu phase

Biến nền tảng web thành sản phẩm có giá trị đầu tiên cho tester:

> Requirement/Figma input → AI phân tích → hỏi làm rõ → user xác nhận Feature Understanding → AI sinh test case đúng chuẩn → user chỉnh sửa và export Excel.

---

## 2. Prerequisites

- Phase 00 đã hoàn thành và dữ liệu persist ổn định.
- Có ít nhất một AI provider/model endpoint server-accessible.
- Có `qa-core` skill/workflow/schema baseline.
- Có testcase column/template ban đầu do team thống nhất.

---

## 3. In Scope

- Model adapter và model selector thực thi.
- Workflow runner cho Manual Test Design.
- Skill/workflow loader từ Markdown.
- Structured AI execution + schema validation/repair.
- Requirement Analysis artifact.
- Clarification loop và readiness evaluation.
- Feature Understanding confirm/revision.
- Testcase generation, table editor, save final.
- Excel export.
- Run/artifact history cơ bản.

## 4. Out of Scope

- Playwright MCP/UI browse thật.
- Sinh automation code.
- Regression/CI/CD.
- API/performance workflows.
- Skill editor trên web.

---

## 5. Manual Workflow Steps

| Step | Output | Gate |
|---|---|---|
| Source intake | Source summary | Có input tối thiểu |
| Requirement analysis | Analysis JSON | Validate output |
| Gap analysis | Missing/conflicts | Nếu critical → clarification |
| Clarification | Questions/answers | Critical resolved hoặc draft-only |
| Readiness evaluation | Ready status | Ready để tạo understanding |
| Feature understanding | Summary artifact | User confirm |
| Testcase generation | Testcase set | Understanding confirmed/explicit draft |
| Testcase review/edit | Final testcase version | User save final |
| Export | XLSX | Selected valid testcase artifact |

---

## 6. Product Rules

| Rule ID | Rule |
|---|---|
| P01-R01 | Analysis không được sinh official testcase |
| P01-R02 | Critical missing rule block official testcase generation |
| P01-R03 | User có thể tạo draft với assumptions; phải có cảnh báo và status riêng |
| P01-R04 | Feature Understanding phải được user confirm trước official TC |
| P01-R05 | AI output phải qua schema validation và semantic checks |
| P01-R06 | Switch model tạo run/artifact version mới, không overwrite output cũ |
| P01-R07 | User edit final TC phải lưu riêng với AI-generated original |
| P01-R08 | Excel export lấy đúng artifact/version user chọn |

---

## 7. Acceptance Criteria

| AC | Criteria |
|---:|---|
| AC-01 | User chọn model và chạy Requirement Analysis được |
| AC-02 | Output hiển thị confirmed/missing/conflicts/assumptions theo schema |
| AC-03 | Nếu thiếu critical rule, system chuyển Needs Clarification và chặn official TC |
| AC-04 | User trả lời câu hỏi và re-evaluate được |
| AC-05 | AI sinh Feature Understanding và user confirm/revision được |
| AC-06 | Khi confirmed, AI sinh testcase đúng columns/schema |
| AC-07 | User edit/save final TC và xem lại bản generated/final |
| AC-08 | User export Excel đúng cột/giá trị |
| AC-09 | Run history hiển thị model, skill revision, status, validation |
| AC-10 | Invalid AI output không được render thành final; repair/failure hoạt động |

---

## 8. Exit Gate

Phase 01 đạt khi tester có thể dùng từ đầu đến cuối với vài feature demo/thực tế không nhạy cảm và chất lượng output đủ để bước vào thu feedback/evaluation.

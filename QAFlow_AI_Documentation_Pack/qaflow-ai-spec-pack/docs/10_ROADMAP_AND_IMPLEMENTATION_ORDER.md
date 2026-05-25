# Roadmap & Implementation Order — QAFlow AI

## 1. Roadmap tổng thể

| Phase | Tên | Kết quả chính | Build ngay? |
|---:|---|---|---:|
| 00 | Foundation | Web + persistence + project/feature/input | Có |
| 01 | Manual QA MVP | Clarification → understanding → TC → Excel | Có |
| 02 | Skill Quality | Feedback/model comparison/skill improvement | Sau khi thử MVP |
| 03 | UI Exploration | Playwright MCP đối chiếu UI thật | Sau Manual ổn |
| 04 | Automation POM | Generate/validate Playwright code | Sau Phase 03 |
| 05 | Regression Hub | Run/report/CI/failure analysis | Sau automation ổn |
| 06 | API Automation | API design/code/regression | Theo nhu cầu |
| 07 | Performance | NFR → k6 plan/run/report | Theo nhu cầu |
| 08 | Optional Anti-bot | Runtime được cấp phép | Chỉ khi thực sự có use case |

---

## 2. Vì sao phải đi theo thứ tự này?

### Foundation trước AI

Nếu không lưu được input/artifact/version, kết quả AI không thể dùng lại hoặc đánh giá.

### Manual trước Automation

Nếu AI chưa hiểu rule và chưa viết TC đủ chuẩn, automation sẽ viết sai scenario; effort sửa tăng thay vì giảm.

### Evaluation trước MCP/Automation

Bạn cần biết skill Markdown và model có tạo artifact hữu ích hay không trước khi tốn công xây worker/browser/repo integration.

### Worker chỉ khi thực sự cần execution

Vercel web phù hợp control plane; browser/testing workloads cần worker riêng và thêm vận hành/chi phí.

---

## 3. Milestone Release Plan

## Release A — Internal PoC

Bao gồm Phase 00 + phần lõi Phase 01:

- Dùng data demo.
- Một model/provider.
- Requirement text/Markdown + image input cơ bản.
- Analysis/clarification/understanding/TC/export.

**Success signal:** bạn tự dùng cho 3–5 feature và TC sinh ra có thể chỉnh sửa sử dụng được.

## Release B — Team Trial

Bao gồm hoàn chỉnh Phase 01 + Phase 02 tối thiểu:

- File docs/Figma export dùng ổn.
- Model switch.
- Feedback/history.
- Access gate/login tối thiểu và hosting plan phù hợp dữ liệu thật.

**Success signal:** tester khác dùng được mà không cần bạn giải thích nhiều; edit rate bắt đầu đo được.

## Release C — Automation Pilot

Bao gồm Phase 03–04:

- UI exploration worker.
- Một repo automation pilot.
- POM generator + validation run.

**Success signal:** một flow regression thực tế được generate/review/validate mà code maintainable.

## Release D — Quality Pipeline

Bao gồm Phase 05 và nhu cầu cụ thể Phase 06/07/08.

---

## 4. Stop/Go Criteria

| Sau phase | Go khi | Dừng cải thiện khi |
|---|---|---|
| 00 | Persistence/input/UI ổn | Data mất, upload lỗi, cấu trúc code rối |
| 01 | TC hữu ích, gate đúng | AI đoán rule, format lỗi nhiều, user không tin output |
| 02 | Đo được cải thiện | Không thu feedback đủ để quyết định |
| 03 | UI snapshot/mismatch có giá trị | Worker không ổn hoặc target access không rõ |
| 04 | Code POM maintainable | Code generated cần sửa quá nhiều |
| 05 | Reports hỗ trợ quyết định | Evidence/false failures quá tốn công |

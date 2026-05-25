# Phase 02 Specification — Skill Quality & Model Evaluation

## 1. Mục tiêu phase

Sau khi Manual MVP có người dùng thử, biến feedback thực tế thành dữ liệu cải thiện skill Markdown và lựa chọn model:

- Ghi nhận AI output so với bản tester sửa/final.
- Cho tester rating/feedback theo artifact.
- So sánh model trên cùng input + cùng skill/schema.
- Theo dõi skill revision nào cải thiện chất lượng.

Phase này **không phải fine-tune model** và không tự động thay skill production.

---

## 2. In Scope

- Feedback/rating cho analysis, clarification, understanding, testcase.
- Diff generated vs final testcase.
- Evaluation dataset từ feature đã hoàn thành.
- Compare run: cùng input/same skill revision, chọn hai model, kết quả độc lập.
- Dashboard metric cơ bản.
- Quản lý “golden example candidate” và hướng dẫn cập nhật Markdown qua Git.

## 3. Out of Scope

- Web editor/publisher đầy đủ cho skill.
- Auto-deploy skill revision.
- Fine-tuning/RAG phức tạp.
- Automation/MCP.

---

## 4. Metrics

| Metric | Ý nghĩa |
|---|---|
| Schema pass rate | Model có tuân contract không |
| Repair rate | Mức cần sửa format tự động |
| Approval without edit rate | Output đủ tốt không cần sửa |
| Testcase edited cell count | Tester sửa nhiều ở phần nào |
| Coverage addition count | User phải thêm case nào |
| Clarification helpful rating | Câu hỏi AI có hữu ích không |
| Skill revision comparison | Revision mới tốt hơn hay tệ hơn |
| Model comparison | Model nào hợp từng skill |

---

## 5. Acceptance Criteria

- Tester đánh giá artifact sau khi review.
- Hệ thống lưu feedback gắn đúng model/skill revision/artifact.
- Có màn hình so sánh output generated và final.
- Có compare run cho một step bằng hai model mà không ảnh hưởng official artifact.
- Có dashboard số liệu cơ bản phục vụ sửa `.md` trong GitHub.

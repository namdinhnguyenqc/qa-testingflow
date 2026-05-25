# Phase 02 Tasks — Skill Quality & Model Evaluation

## P02-T01 — Feedback data model

- Thêm migrations `artifact_feedback`, `evaluation_runs`, `evaluation_results` hoặc cấu trúc tương đương.
- Lưu rating, issue categories, free text feedback, generated/final artifact linkage.
- Không sửa/xóa artifact gốc khi ghi feedback.

## P02-T02 — Feedback UI

- Thêm action đánh giá artifact: Good / Needs Revision / Rejected.
- Cho chọn lỗi thường gặp: missing rule, duplicate case, unclear expected result, wrong format, unnecessary questions.
- Hiển thị feedback history trên artifact.

## P02-T03 — Generated vs Final Diff

- Tạo diff view cho testcase set generated và final version.
- Tổng hợp số case thêm/xóa/sửa và các field được sửa.
- Không cần diff văn bản quá phức tạp; ưu tiên structured table diff đáng tin.

## P02-T04 — Model comparison run

- User chọn feature/step và hai model.
- Chạy cùng input snapshot, cùng skill/schema revision.
- Save kết quả là evaluation artifacts, không thay official current artifact.
- UI side-by-side + feedback selection.

## P02-T05 — Evaluation dashboard

- Metric theo skill revision/model/step.
- Filter timeframe/project/feature nếu dữ liệu đủ.
- Export summary optional.

## P02-T06 — Golden example workflow documentation

- Cho đánh dấu final artifact là candidate example.
- Tạo hướng dẫn developer copy/redact artifact sang `qa-core/examples/approved/` rồi commit Git.
- Không auto ghi trực tiếp GitHub repo trong phase này.

## Definition of Done

- Team biết skill/model đang yếu ở đâu dựa trên data, không chỉ cảm giác.
- Việc cải thiện skill vẫn đi qua Git review/deploy rõ ràng.

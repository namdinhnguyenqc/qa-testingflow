# Phase 06 Specification — API Test Design & Automation

## 1. Mục tiêu phase

Bổ sung workflow chuyên biệt để AI phân tích API contract/Swagger/Postman hoặc backend rule, hỏi lại các điểm chưa rõ và sinh API test design/automation có thể chạy trong regression.

---

## 2. Lý do tách riêng khỏi UI Automation

API testing cần quan tâm các vấn đề riêng:

- Authentication/authorization/token lifecycle.
- Request/response schema.
- Status codes/error payload.
- Idempotency/duplicate/concurrency.
- Setup/cleanup test data.
- Contract vs business verification.

Không nên chỉ chuyển UI testcase sang API script một cách máy móc.

---

## 3. Inputs

| Input | Required |
|---|---:|
| Approved feature/business understanding | Có |
| API contract: OpenAPI/Swagger/Postman/docs | Có cho official API design |
| Environment/base URL | Có |
| Auth strategy/test credential handling | Có |
| Existing API test repo/convention | Cần khi sinh code |
| Test data/reset policy | Cần khi execute |

---

## 4. In Scope

- API workflow/skills/output schemas.
- Endpoint coverage mapping.
- Clarification cho contract/business mismatch.
- API testcase generation.
- API automation proposal; lựa chọn Playwright APIRequestContext hoặc framework đã cấu hình.
- Validation run và tích hợp regression sau review.

## 5. Out of Scope

- Performance/load test.
- Gửi request tới production nếu không được phép.
- Auto update backend code/API contract.

---

## 6. Acceptance Criteria

- AI xác định endpoint/rule/negative/error/authorization cases từ input.
- Nếu thiếu auth/error/status contract quan trọng, bắt buộc clarification.
- Sinh API TC đúng schema và mapping tới endpoint/rule.
- Sinh code proposal đúng convention project và chạy validate được.
- Kết quả có thể gắn vào suite regression sau user approval.

# Phase 07 Specification — Performance Testing Workflow

## 1. Mục tiêu phase

Tạo workflow chuyên biệt cho performance testing dựa trên NFR/SLA/load profile có xác nhận, thay vì AI tự suy đoán tải hoặc tự chạy load test.

---

## 2. Performance Principle

Performance là loại mục tiêu kiểm thử riêng, không phải đơn giản là “automation”. Mọi execution phải có approval và target environment rõ ràng.

---

## 3. Required Inputs

| Input | Required before official plan/execution |
|---|---:|
| Performance objective/test type | Có |
| NFR/SLA/SLO thresholds | Có |
| Critical journey/endpoints | Có |
| Load profile: VU/RPS/ramp/duration/think time | Có |
| Authorized performance environment | Có trước execution |
| Test data/auth strategy | Có trước execution |
| Monitoring/observability access | Khuyến nghị mạnh cho analysis |

---

## 4. Supported Test Types

- Load test.
- Stress test.
- Spike test.
- Soak/endurance test.
- Baseline comparison.

---

## 5. In Scope

- NFR intake/clarification.
- Performance test plan artifact.
- k6 script proposal (hoặc configured framework).
- Explicit execution approval gate.
- Worker run/report/threshold outcome.
- Baseline comparison metadata.

## 6. Out of Scope

- Tự tạo tải khi chưa user approval.
- Chạy production mặc định.
- Tự kết luận root cause nếu không có metric chứng minh.

---

## 7. Acceptance Criteria

- AI hỏi lại nếu thiếu SLA/load profile/environment permission.
- Không có nút Run khi plan chưa approved.
- Script/report map được về goal và thresholds.
- Report ghi rõ pass/fail threshold và các quan sát, phân biệt inference với evidence.

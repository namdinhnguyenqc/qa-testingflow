# Phase 05 Specification — Regression Hub & CI/CD Integration

## 1. Mục tiêu phase

Tập trung quản lý test suite, kích hoạt run sau build/manual, lưu report/evidence và hỗ trợ AI phân loại failure.

---

## 2. In Scope

- Suite management: smoke/regression/custom.
- Test run records và run status.
- Manual trigger và/hoặc CI webhook integration.
- Playwright run/report ingestion.
- Evidence failed tests.
- AI failure classification: suspected product bug/script issue/data/environment/flaky candidate.

## 3. Out of Scope

- Auto fix product code.
- Auto merge test locator fixes mà không review.
- Performance test execution.
- Anti-bot runtime mặc định.

---

## 4. Acceptance Criteria

- User tạo/chọn suite và chạy trên environment được phép.
- CI build hoặc manual run tạo test run record.
- Dashboard hiển thị pass/fail/skipped/duration.
- Failed case có evidence phù hợp.
- AI failure summary không thay thế quyết định bug chính thức; hiển thị là classification đề xuất.

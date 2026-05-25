# Phase 08 Specification — Optional Authorized Anti-bot Runtime

## 1. Mục tiêu phase

Cung cấp runtime/configuration tùy chọn cho việc kiểm thử anti-bot/fingerprint/CAPTCHA của **hệ thống mà team có quyền kiểm thử**, không biến QAFlow AI thành công cụ né bảo vệ website bên ngoài.

---

## 2. Positioning

- Đây là module optional, không phải core MVP.
- Standard Playwright browser vẫn là runtime mặc định cho functional/regression.
- Runtime stealth/fingerprint chỉ được bật cho project/environment/suite được đánh dấu authorized anti-bot test.

---

## 3. Preconditions

- Có policy nội bộ xác nhận quyền test target.
- Có environment sandbox/staging hoặc target được phép.
- Có allowlist và audit metadata.
- Có worker isolation và secret/proxy handling phù hợp.

---

## 4. In Scope

- Browser runtime abstraction: standard/optional configured runtime.
- Explicit authorized environment/suite configuration.
- Anti-bot test design artifact: mục tiêu, expected challenge/false positive criteria.
- Run/evidence/report trong phạm vi được phép.

## 5. Out of Scope / Prohibited by product design

- Truy cập/chạy vượt anti-bot trên website bên thứ ba không có quyền.
- Tự động tạo tài khoản/giao dịch giả trên nền tảng ngoài scope.
- Mở runtime cho mọi regression suite mặc định.
- Tuyên bố chắc chắn “bypass mọi hệ thống”.

---

## 6. Acceptance Criteria

- Runtime optional chỉ selectable trong authorized project/environment.
- Mỗi run lưu target/suite/runtime/approval metadata.
- Domain ngoài allowlist bị chặn.
- Standard browser vẫn là default.
- UI/report trình bày đây là security/anti-bot validation nội bộ.

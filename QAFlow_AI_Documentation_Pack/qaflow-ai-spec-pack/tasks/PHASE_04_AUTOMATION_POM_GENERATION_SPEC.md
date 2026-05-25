# Phase 04 Specification — Playwright Automation Generation with POM

## 1. Mục tiêu phase

Từ testcase đã final/approved, AI sinh đề xuất automation test có cấu trúc maintainable theo **Playwright + TypeScript + Page Object Model (POM)**, chạy validation trước khi tester đưa vào repository chính thức.

---

## 2. Preconditions

- Manual testcase final tồn tại.
- Target environment/allowlist đã được thiết lập.
- Có automation repository/convention/POM rules hoặc sample cấu trúc.
- Worker có Playwright Test runtime.

---

## 3. In Scope

- Automation candidate selection/mapping.
- Automation project configuration/reference.
- Load POM convention skill.
- Generate code proposal/diff, không merge trực tiếp.
- Validation run và evidence tối thiểu.
- User review/export/copy/PR handoff theo scope được chọn.

## 4. Rules bắt buộc

- Spec file không chứa toàn bộ locators/actions khi đã xác định page object phù hợp.
- Ưu tiên locator: role → label → test id → lý do cho fallback.
- Không hard-code credentials/secrets.
- Không sửa product source code.
- Không auto merge main branch.
- Testcase draft/assumption không làm nguồn automation official.

## 5. Acceptance Criteria

- User chọn final testcases để generate automation proposal.
- Output chỉ rõ files create/modify, code diff, validation command, risk.
- Code tuân POM convention configured.
- Validation result và evidence hiển thị trên web.
- User quyết định handoff; không tự merge.

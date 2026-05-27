# Phase 03 Specification — UI Exploration with Playwright MCP

## 1. Mục tiêu phase

Bổ sung khả năng AI kiểm tra giao diện staging/UAT thật để so sánh với Docs/Figma và nâng chất lượng requirement analysis.

> Playwright MCP được dùng để khám phá/đọc UI theo structured accessibility snapshots; đây chưa phải bước chạy regression automation chính thức.

---

## 2. Kiến trúc bắt buộc

- Web app tạo/quan sát exploration job.
- Browser/MCP chạy trong worker service riêng, không chạy trực tiếp trong Vercel request thông thường.
- Chỉ truy cập domain/environment đã cấu hình cho project/feature.

---

## 3. In Scope

- Environment URL + allowed domain configuration tối thiểu.
- Worker job lifecycle.
- Playwright MCP integration trong worker.
- UI snapshot artifact, discovered fields/buttons/validation/messages/navigation.
- Docs/Figma/UI conflict detection skill.
- Clarification bổ sung dựa trên mismatch.

## 4. Out of Scope

- Sinh automation POM code.
- Regression suite.
- Crawl không giới hạn hoặc truy cập website ngoài allowed target.
- CloakBrowser.

---

## 5. Acceptance Criteria

- User thêm được authorized staging URL/domain.
- User trigger explore UI job; UI theo dõi trạng thái job.
- Worker lấy được UI snapshot và lưu artifact.
- AI hiển thị discovered components và mismatch với existing sources.
- Nếu mismatch critical, có thể tạo clarification mới.
- Domain ngoài allowlist bị chặn.

---

## Architecture Update: BrowserToolAdapter

Phase 03 is Browser UI Exploration via `BrowserToolAdapter`, not direct Playwright MCP coupling.

- MCP is a protocol for tool access, not a model provider and not an output framework.
- `PlaywrightMcpAdapter` is the first browser tool provider.
- `SeleniumMcpAdapter` is a future browser tool provider.
- Workflow logic requests browser exploration through the adapter contract.
- Worker/runtime implementation chooses the adapter provider.
- Exploration Tool choice is independent from Automation Output Profile choice.

Phase 03 remains exploration only. It does not generate automation code and does not define the Phase 04 automation framework.

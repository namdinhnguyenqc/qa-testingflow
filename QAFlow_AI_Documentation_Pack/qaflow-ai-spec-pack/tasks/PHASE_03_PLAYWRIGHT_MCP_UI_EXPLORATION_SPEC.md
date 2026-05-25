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

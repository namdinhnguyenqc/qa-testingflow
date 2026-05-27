# Phase 03 Tasks — Playwright MCP UI Exploration

## P03-T01 — Environment/allowlist model

- Thêm entity/config cho authorized environments và domain allowlist.
- UI thêm/sửa URL dùng cho feature exploration.
- Validate URL/domain trước tạo job.

## P03-T02 — Worker/job architecture

- Define job record/status/progress/result/error contract.
- Chọn và cấu hình worker host/container runtime phù hợp.
- Web app chỉ enqueue/show status; không launch browser trực tiếp trong request dài.

## P03-T03 — Playwright MCP worker integration

- Cấu hình MCP server/client theo tài liệu chính thức.
- Navigate target đã allowed.
- Capture structured snapshots/các thao tác read-only hoặc exploration được phép.
- Upload/persist artifact output.

## P03-T04 — UI exploration skill/output schema

- Thêm skill `.md` cho UI explorer và source conflict analyzer.
- Thêm schema artifact: screens, controls, labels, messages, interactions, observed differences.
- Validate và version artifact.

## P03-T05 — Analysis integration

- Cho Manual workflow chọn include UI exploration artifact.
- Render conflicts Docs/Figma/UI và bổ sung clarification.
- Không silently cập nhật confirmed rules.

## P03-T06 — Security/test/operations

- Domain block tests.
- Worker error/timeout/retry.
- Log redaction và screenshot policy nếu có.
- Document deployment setup.

## Definition of Done

- UI thật trở thành nguồn input có kiểm soát cho requirement analysis; chưa sinh code automation.

---

## Task Boundary Update

When implementing Phase 03, create/consume a `BrowserToolAdapter` boundary. The first provider is `PlaywrightMcpAdapter`; `SeleniumMcpAdapter` is future. Do not make workflow code call Playwright MCP directly. Keep exploration tooling independent from automation output profiles.

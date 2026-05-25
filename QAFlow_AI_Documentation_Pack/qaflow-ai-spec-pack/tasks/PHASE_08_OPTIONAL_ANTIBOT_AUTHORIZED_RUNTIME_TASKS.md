# Phase 08 Tasks — Optional Authorized Anti-bot Runtime

## P08-T01 — Policy and authorization metadata

- Define fields: authorized target, purpose, environment, reviewer/note, enabled runtime, expiry optional.
- Không phụ thuộc role system; vẫn yêu cầu explicit configuration trước run.

## P08-T02 — Runtime abstraction

- Worker interface chọn standard Playwright hoặc optional runtime.
- Standard runtime default; optional runtime disabled nếu thiếu authorization metadata.

## P08-T03 — Secure configuration

- Proxy/credential secrets server/worker-only.
- Domain allowlist enforcement.
- Audit/run metadata và evidence policy.

## P08-T04 — Anti-bot workflow skill

- Thiết kế test plan cho false-positive/challenge/fingerprint rule của target được phép.
- Output/report không mô tả mục đích lạm dụng hoặc target bên ngoài.

## P08-T05 — Verification and misuse controls

- Test blocked domain/runtime misuse cases.
- Document operational policy và limitations.

## Definition of Done

- Module có kiểm soát, optional và không làm thay đổi core positioning của QAFlow AI.

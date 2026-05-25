# Phase 06 Tasks — API Test Design & Automation

## P06-T01 — API source types & workflow assets

- Bổ sung input type cho OpenAPI/Swagger/Postman/API docs.
- Tạo workflow/skills/schema cho API analysis, clarification, testcase, automation.

## P06-T02 — API contract analysis

- Parse hoặc cung cấp text/API contract context theo implementation an toàn.
- Output endpoint list, request/response/auth/error/business mapping.
- Detect missing/conflict với feature understanding.

## P06-T03 — API clarification & test design

- Hỏi các điểm block: status/error, auth, idempotency, data cleanup.
- Sinh API testcase final sau gate.

## P06-T04 — API automation proposal

- Config framework/convention phù hợp automation repo.
- Sinh code proposal, fixture/data handling và validation command.
- Không hard-code token/secret.

## P06-T05 — Execute/ingest/regression linkage

- Worker validation run trong environment được phép.
- Lưu results/evidence nhỏ/log redacted.
- Add approved API automation vào regression suites.

## Definition of Done

- Một API feature có thể đi từ contract tới validated automation proposal với traceability.

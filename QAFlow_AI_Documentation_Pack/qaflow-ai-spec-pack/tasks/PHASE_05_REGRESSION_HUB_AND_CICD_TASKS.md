# Phase 05 Tasks — Regression Hub & CI/CD

## P05-T01 — Suite/run data model

- Tables/entities cho suites, suite cases, runs, results, evidence, build refs.
- Link testcase ↔ automation test reference ↔ run result.

## P05-T02 — Suite management UI

- Create/edit suites; gắn approved automation cases.
- Environment/browser runtime selection trong phạm vi allowed.

## P05-T03 — Execution trigger integration

- Manual trigger qua worker.
- Webhook contract cho GitHub Actions/CI pipeline nếu chọn.
- Idempotency và signature/security cho webhook.

## P05-T04 — Report ingestion & dashboard

- Parse/store Playwright JSON/HTML metadata.
- Dashboard pass/fail/skipped/duration/filter.
- Evidence links private/signed.

## P05-T05 — Failure analysis skill

- AI đọc result/log/evidence metadata hợp lý.
- Trả classification/rationale/suggested next action theo schema.
- Label là suggestion, không tự tạo bug/fix code mặc định.

## P05-T06 — Retention/operations

- Failed evidence retention policy.
- Cleanup job hoặc documented manual maintenance.
- Cost/usage monitoring.

## Definition of Done

- Regression result có thể xem tập trung và truy ngược về testcase/automation/build.

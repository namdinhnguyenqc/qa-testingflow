# Phase 04 Tasks — Automation POM Generation

## P04-T01 — Automation repository/convention setup

- Entity/config lưu repo reference, framework, branch strategy, project path convention.
- UI cho project cấu hình automation convention/POM skill reference.
- Không lưu Git token plaintext/client-side.

## P04-T02 — Automation candidate mapping

- Cho user chọn testcase final.
- AI skill đánh giá automate/not automate, target layer UI/API, suite candidate.
- Lưu mapping giữa testcase và automation proposal.

## P04-T03 — POM generator skill + schemas

- Thêm `playwright-pom-generator.skill.md` và output contract.
- Load existing project files/conventions trong worker theo policy.
- Generate proposed files/diff/validation command.

## P04-T04 — Code proposal review UI

- Render files to create/modify, code diff, rationale/risk.
- Cho user reject/regenerate/accept handoff.
- Version proposals, không overwrite.

## P04-T05 — Validation runner

- Worker chạy targeted Playwright validation.
- Capture pass/fail, log, screenshot/trace khi fail theo policy.
- Lưu result và evidence metadata.

## P04-T06 — Git handoff integration

- Chọn mức MVP: download patch/copy files hoặc create branch/PR.
- Nếu tích hợp PR, require explicit user action và secure token handling.
- Không auto merge.

## Definition of Done

- Ít nhất một testcase final được chuyển thành POM proposal, validate và review end-to-end.

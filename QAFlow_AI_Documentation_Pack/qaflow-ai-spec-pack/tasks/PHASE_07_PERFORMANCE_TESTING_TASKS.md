# Phase 07 Tasks — Performance Testing Workflow

## P07-T01 — Performance data model & workflow assets

- Entities cho performance requirement, plan, script proposal, authorized run, result, baseline.
- Skills/schema cho NFR analysis, clarification, plan, report analysis.

## P07-T02 — NFR/SLA intake & clarification

- UI/input types cho SLA, load profile, environment, journey.
- AI analysis và critical question gating.

## P07-T03 — Performance test plan

- Plan artifact gồm mục tiêu, test type, workload model, thresholds, test data, monitoring, stop condition, risks.
- User approval gate rõ ràng.

## P07-T04 — k6 script proposal & validation

- Sinh script/config proposal theo plan approved.
- Lint/smoke validate script không tạo tải lớn trước khi approve run.

## P07-T05 — Authorized execution worker

- Chỉ run khi target/load scope approved.
- Capture k6 outputs/threshold result/logs; không expose secrets.

## P07-T06 — Report and baseline comparison

- Dashboard threshold pass/fail/metrics.
- Compare build/run baselines khi đủ data.
- AI nhận định có trích dẫn metrics và ghi rõ inference.

## Definition of Done

- Không thể vô tình chạy tải chưa cấp phép; plan/script/report đều traceable.

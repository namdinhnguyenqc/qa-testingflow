# QAFlow AI — AI QA Workflow & Skill Platform

## Product summary

QAFlow AI là website cho team tester chạy quy trình QA có AI hỗ trợ theo skill/version được chuẩn hóa:

```text
Docs / Figma / API / URL
  → AI Requirement Analysis
  → Clarification Loop
  → Confirmed Feature Understanding
  → Manual Test Cases đúng template
  → Excel Export
  → future: MCP / Automation POM / Regression / API / Performance
```

## Core engineering decisions

- Next.js + TypeScript cho web/control plane.
- Supabase Postgres + private Storage cho persistent data/files.
- Vercel phù hợp PoC/deploy Next.js; kiểm tra plan/terms trước khi dùng cho team/công việc thực tế.
- Workflow/skill/template nằm trong GitHub dạng Markdown.
- Model switch được, nhưng output bị ép bởi schema/validator và gate nghiệp vụ.
- Automation/browser jobs về sau chạy trong worker riêng, không nhét vào Vercel MVP.

## Read first

1. `00_START_HERE.md`
2. `AGENTS.md`
3. `docs/01_PRODUCT_REQUIREMENTS.md`
4. `docs/02_SYSTEM_ARCHITECTURE.md`
5. `docs/04_TECH_STACK_AND_DEPLOYMENT.md`
6. `tasks/PHASE_00_FOUNDATION_SPEC.md`
7. `tasks/PHASE_00_FOUNDATION_TASKS.md`

## MVP scope

```text
Phase 00: Foundation/Persistence
Phase 01: Manual QA Workflow
Phase 02: Skill Quality/Model Evaluation
```

Không làm sớm: MCP, automation, regression, performance, optional anti-bot runtime.

## Tech stack overview

| Area | Stack |
|---|---|
| Web | Next.js App Router, TypeScript, Tailwind, shadcn/ui |
| State/form/table | React Hook Form, Zod, TanStack Table |
| DB/storage | Supabase Postgres + Supabase Storage |
| Hosting | Vercel for web MVP/PoC |
| AI | Model Adapter; provider/server-accessible gateway |
| Structured output | JSON Schema + AJV, semantic validation |
| Export | ExcelJS |
| Tests | Vitest + Playwright Test |
| Future automation | Worker + Playwright MCP + Playwright POM |
| Future CI | GitHub Actions/approved CI pipeline |

## Package structure

- `docs/` — product/system/engineering documents.
- `tasks/` — phase specifications and task execution documents.
- `qa-core-samples/` — initial Markdown workflow/skill files to copy into implementation repo.

## Documentation status

Bộ tài liệu này là implementation baseline. Trong quá trình code, mọi thay đổi scope/kiến trúc phải cập nhật tài liệu tương ứng và ghi rõ quyết định trước khi triển khai.

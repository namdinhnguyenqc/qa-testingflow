# QAFlow AI — Start Here

> Bộ tài liệu triển khai cho website **AI QA Workflow & Skill Platform** dành cho team tester.
>
> Mục tiêu: dựng một nền tảng web nhận Docs/Figma/API/UI input, chạy workflow AI theo các skill Markdown, hỏi lại đến khi hiểu đủ tính năng, sinh test case đúng format team; sau đó mở rộng sang automation, regression, API và performance testing.

---

## 1. Các quyết định đã chốt

| Hạng mục | Quyết định |
|---|---|
| Loại sản phẩm | Website nội bộ hỗ trợ quy trình QA bằng AI, không phải chatbot tự do |
| Cách quản lý skill | File `.md` trong GitHub, review/version bằng Git commit |
| Cách quản lý workflow | File `.md`/manifest cấu hình trong repo; mỗi step gắn một skill |
| Model | Cho phép switch Claude/Codex/OpenAI-compatible; không gắn cứng provider |
| Tính nhất quán output | Output contract + JSON Schema validation + repair cycle + human confirmation |
| MVP | Phân tích Docs/Figma → clarification loop → feature understanding → manual test cases → export Excel |
| Hosting web | Next.js deploy trên Vercel cho PoC; kiểm tra plan trước khi dùng cho công việc/team thương mại |
| Database & file | Supabase Postgres + private Supabase Storage |
| Login/phân quyền | Không xây RBAC trong MVP; với dữ liệu thật phải có access gate/login tối thiểu |
| Automation về sau | Worker service riêng + Playwright MCP + Playwright Test + POM |
| 9Router | Có thể là gateway model khi được host truy cập từ web/worker; không phụ thuộc `localhost` trong bản deploy |
| CloakBrowser | Tùy chọn rất muộn, chỉ cho suite anti-bot nội bộ/được cấp phép |

---

## 2. Cách đọc bộ tài liệu này

### Tài liệu nền tảng

| File | Dùng để làm gì |
|---|---|
| `docs/01_PRODUCT_REQUIREMENTS.md` | Product scope, feature list, acceptance criteria dưới góc nhìn BA/PO |
| `docs/02_SYSTEM_ARCHITECTURE.md` | Kiến trúc hệ thống, component boundary, kiến trúc hiện tại và tương lai |
| `docs/03_USER_FLOWS_AND_STATE_MACHINE.md` | Flow nghiệp vụ và trạng thái feature/workflow |
| `docs/04_TECH_STACK_AND_DEPLOYMENT.md` | Tech stack, local/dev/deploy, môi trường, giới hạn nền tảng |
| `docs/05_DATA_MODEL_AND_STORAGE.md` | Database schema, storage convention, artifact versioning |
| `docs/06_AI_WORKFLOW_SKILLS_AND_OUTPUT_CONTRACT.md` | Workflow/skill Markdown, model switch, JSON output contract, evaluation |
| `docs/07_ENGINEERING_STANDARDS.md` | Quy tắc bắt buộc khi code, test, security, migration, review |
| `docs/08_UI_UX_SPECIFICATION.md` | Màn hình, hành vi UX, trạng thái loading/error/empty |
| `docs/09_SECURITY_COST_AND_OPERATIONS.md` | Secret, file access, retention, cost, vận hành |

### Tài liệu thực thi từng phase

Mỗi phase có hai file:

- `*_SPEC.md`: mục tiêu, phạm vi, flow, acceptance criteria, không được làm quá scope.
- `*_TASKS.md`: danh sách task có thể giao trực tiếp cho coding agent thực hiện.

| Phase | Mục tiêu |
|---:|---|
| 00 | Foundation: web app, DB/storage, project/feature/input, cấu trúc qa-core |
| 01 | Manual QA MVP: requirement analysis, clarification, understanding, TC, Excel |
| 02 | Skill Quality & Model Evaluation: feedback, compare output, skill improvement |
| 03 | UI Exploration: Playwright MCP worker đối chiếu UI thật |
| 04 | Automation Generation: Playwright + TypeScript + POM, code diff, validation |
| 05 | Regression Hub & CI/CD: suite, run, report, evidence, AI failure analysis |
| 06 | API Automation Workflow |
| 07 | Performance Testing Workflow |
| 08 | Optional Anti-bot Authorized Runtime |

---

## 3. Thứ tự triển khai bắt buộc

```text
Phase 00 — Foundation
   ↓
Phase 01 — Manual QA MVP
   ↓
Dùng thật với dữ liệu demo/team nhỏ, thu feedback
   ↓
Phase 02 — Skill Quality & Evaluation
   ↓
Chỉ khi Manual flow ổn định mới làm:
Phase 03 → Phase 04 → Phase 05
   ↓
Phase 06/07/08 triển khai theo nhu cầu thực tế
```

**Không bắt đầu bằng Automation hoặc MCP.** Nếu requirement understanding và manual TC chưa đáng tin cậy, automation chỉ tạo thêm code sai và report nhiễu.

---

## 4. Cách giao code cho Codex/Claude theo tài liệu này

Khi giao một phase cho coding agent:

1. Gửi `AGENTS.md` làm rule nền.
2. Gửi file `docs/*` liên quan.
3. Chỉ định đúng `tasks/PHASE_XX_*_TASKS.md` cần triển khai.
4. Yêu cầu agent bắt đầu bằng Implementation Checklist, không sửa code ngay.
5. Yêu cầu agent không triển khai các phase sau dù thấy có thể làm.
6. Sau mỗi task, yêu cầu chạy lint/typecheck/test/build và report file đã thay đổi.

Ví dụ yêu cầu:

```text
Đọc AGENTS.md, docs/02_SYSTEM_ARCHITECTURE.md, docs/05_DATA_MODEL_AND_STORAGE.md,
tasks/PHASE_00_FOUNDATION_TASKS.md.
Chỉ thực hiện Task P00-T01 đến P00-T03.
Trước khi code, output Implementation Checklist và danh sách file dự kiến tác động.
Không triển khai AI, clarification hoặc testcase ở task này.
```

---

## 5. Definition of MVP Done

MVP được coi là đạt khi:

- User tạo được Project và Feature.
- User upload/paste được Requirement và ảnh/PDF Figma export.
- User chọn model và chạy Manual Test Design workflow.
- AI trả Requirement Analysis theo schema; phát hiện missing/conflict/assumption.
- Nếu thiếu critical rule, UI bắt buộc dừng ở Clarification.
- User trả lời và AI sinh Feature Understanding Summary.
- User xác nhận understanding trước khi sinh official testcase.
- Test case được render dạng table, chỉnh sửa và export Excel.
- Dữ liệu vẫn tồn tại sau reload/redeploy vì nằm trong Supabase.
- Output lưu được model, skill file/commit, input snapshot, schema validation result.

---

## 6. Cấu trúc repo đích khuyến nghị

```text
qaflow-ai/
├── AGENTS.md
├── docs/
├── tasks/
├── qa-core/
│   ├── workflows/
│   ├── skills/
│   ├── schemas/
│   ├── templates/
│   └── examples/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   └── types/
├── supabase/
│   └── migrations/
├── tests/
├── .env.example
├── package.json
└── README.md
```

---

## 7. Những quyết định phải giữ đúng khi code

1. **Skill/workflow không hard-code trong component UI.** Chúng nằm ở `qa-core/` và được load bởi service layer.
2. **Artifact AI quan trọng không lưu dưới dạng text tự do duy nhất.** Lưu JSON có schema version; Markdown chỉ là bản hiển thị/export.
3. **Model adapter không phụ thuộc model cụ thể.** Step chỉ biết `modelId/providerId`, không gọi SDK tùy tiện trong UI.
4. **Không dùng filesystem runtime của Vercel để lưu dữ liệu người dùng.** Data/file nằm ở Supabase.
5. **Official testcase chỉ sinh khi Feature Understanding đã được confirm.** Nếu thiếu rule chỉ tạo Draft có assumptions.
6. **Playwright browser/test runner không nhét vào Vercel MVP.** Khi cần, dùng worker service riêng.
7. **Không triển khai CloakBrowser vào core product.** Chỉ là runtime optional sau khi có policy và allowlist.

---

## 8. Tài liệu tham khảo chính thức cần kiểm tra khi implement

- Next.js App Router: https://nextjs.org/docs/app
- Next.js deployment trên Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel plans/fair use: https://vercel.com/docs/plans/hobby và https://vercel.com/docs/limits/fair-use-guidelines
- Supabase Database: https://supabase.com/docs/guides/database/overview
- Supabase Storage: https://supabase.com/docs/guides/storage
- Playwright MCP: https://playwright.dev/docs/getting-started-mcp
- Playwright CI: https://playwright.dev/docs/ci-intro
- 9Router repo: https://github.com/decolua/9router

---

## 9. Architecture Addendum — Multi-workflow Platform

QAFlow AI is a multi-workflow platform, not only a Manual QA testcase generator. The shared Requirement Understanding Layer feeds:

- Manual QA.
- Automation QA.
- API QA.
- Performance QA.
- Shared Evaluation, History, and Reports.

Core Engine responsibilities:

- Workflow execution and step orchestration.
- Persistence, artifact versioning, validation, and security.
- UI and integration boundaries.

Custom Skill responsibilities:

- Requirement reading rules.
- Testcase format and templates.
- Automation conventions.
- API and performance QA rules.

Skills, schemas, and templates live as Git-versioned `.md` / `.json` files. Core code should load and validate them instead of hard-coding team-specific QA policy.

Phase 01B is **Real Model Provider Integration & Verification**. It verifies Manual QA using real Supabase plus a real model provider API key. The model layer remains provider-agnostic and must not lock the product to Claude, Codex, or any single provider. The OpenAI-compatible adapter may be used with DeepSeek or compatible endpoints. A Claude-native adapter is optional/future. Team and production modes must never fall back to mock output. Phase 01B does not use MCP.

MCP is a tool protocol, not a model provider and not an output framework. Browser access is abstracted behind `BrowserToolAdapter`; `PlaywrightMcpAdapter` is the first provider and `SeleniumMcpAdapter` is a future provider. Workflow logic must not call Playwright MCP directly. Exploration Tool choice and Automation Output Profile choice are independent.

Updated roadmap order:

1. Phase 00 — Foundation.
2. Phase 01 — Manual QA MVP.
3. Phase 01B — Real Model Provider Integration.
4. Phase 02 — Evaluation.
5. Phase 03 — Browser UI Exploration via BrowserToolAdapter.
6. Phase 04 — Automation Generation.
7. Phase 05 — Regression.
8. Phase 06 — API QA.
9. Phase 07 — Performance QA.
10. Phase 08 — Optional Anti-bot Runtime.

**AI QA Requirement & Testcase Platform**

Project master plan

Version 1.0

June 2026

  ---------------------- ------------------------------------------------
  **Item**               **Detail**

  Frontend               Next.js (App Router)

  Backend                NestJS (TypeScript)

  Database               PostgreSQL + Prisma ORM

  Queue                  BullMQ + Redis

  AI Validate            ajv (JSON Schema)

  Team                   2 developers

  Timeline               \~4--5 months (Phase 0--3)
  ---------------------- ------------------------------------------------

Table of contents

1\. Executive summary

This document is the single source of truth for the AI QA Requirement &
Testcase Platform project. It consolidates the BA specification
analysis, all technical and design decisions, the technology stack,
phased delivery plan, and per-developer task breakdown.

The platform transforms unclear requirements into structured, traceable
test case sets through an AI-assisted pipeline: Upload → Analyze →
Quality Score + Gap Detection → Gap Review → Rewrite & Approve
Requirement → Generate Testcases → Coverage Analysis → Export Excel.

Key design principles: config-driven workflow, human-in-the-loop
approval, structured JSON output only, full traceability, and semantic
versioning across all artifacts.

2\. Technology stack

  ---------------- --------------------- ---------------------------------
  **Layer**        **Technology**        **Notes**

  Frontend         Next.js (App Router)  React + TypeScript, TanStack
                                         Query, MSW mock

  BFF              Next.js route         Thin proxy to NestJS, holds
                   handlers              session/auth

  Backend          NestJS (TypeScript)   Module-per-domain architecture

  ORM              Prisma                Typed client, migration, seed.
                                         Fallback: TypeORM

  Database         PostgreSQL            pgvector extension in Phase 3

  Queue / Async    BullMQ + Redis        Workflow jobs, AI calls

  Object Storage   MinIO / S3            File uploads, export artifacts

  AI Output        ajv                   JSON Schema validation (spec §12)
  Validate                               

  Secret (Phase    Environment variables Masked in logs and responses
  0--2)                                  

  Secret (Phase 3) Vault / KMS           Production-grade secret
                                         management

  API Contract     OpenAPI + JSON Schema Shared /contracts repo, type
                                         generation

  FE Mock          MSW (Mock Service     Generated from OpenAPI, env
                   Worker)               toggle

  Testcase Table   TanStack Table / AG   Do not build custom grid
                   Grid                  
  ---------------- --------------------- ---------------------------------

3\. Finalized design decisions

The following 6 items were open questions in the BA specification. They
have been decided as follows and apply throughout the project.

  -------- ---------------- --------------------------------- ------------------
  **\#**   **Decision**     **Detail**                        **Impact**

  1        Gate = warning + No hard block. User override      Backend gate
           override         writes label \"Draft with         logic, Frontend
                            unresolved risk\". Applies to     approve UI
                            requirement gate and coverage     
                            gate.                             

  2        Coverage %       10 requirements, 2 not-testable → Coverage engine
           excludes Not     denominator is 8. Industry        formula
           Testable         standard.                         

  3        testcase_sets    \"Regenerate All\" creates new    DB schema, UI
           has version_no   version, old version kept for     version selector
                            trace. Added to Prisma schema.    

  4        File size =      image ≤ 10MB, xlsx ≤ 20MB, doc ≤  Upload validation,
           per-tool +       30MB. Validate per-tool first,    error messages
           global cap 30MB  global second.                    

  5        Default language Configurable per project to       Templates, UI
           = Vietnamese     English. Testcase title           labels, output
                            convention: \"Xác minh\...\"      

  6        Phase 1 = single No roles/permissions. Simple      Auth module scope
           user, thin auth  login. Multi-user/role deferred   
                            to Phase 3.                       
  -------- ---------------- --------------------------------- ------------------

4\. BA clarification questions

The following gaps and contradictions were identified in the BA
specification (v1.0). Items marked Decided have been resolved in Section
3. Items marked Open should be confirmed with the BA/PO.

4.1 High --- blocks testcase writing

  -------- ------------------------------------- ------------- ---------------
  **ID**   **Question**                          **Spec ref**  **Status**

  CQ-01    Login + role: spec §8.1 details full  §8.1, Q02,    Decided: thin
           login with Admin/QA split             Q10           auth
           (AUTH-AC-04/05), but Q02/Q10 ask                    
           whether Phase 1 needs multi-user.                   
           Which is it?                                        

  CQ-02    testcase_sets versioning: §6.5        §6.5, §11.6   Decided: add
           requires version but data model §11.6               version_no
           has no version_no column.                           

  CQ-03    Coverage % formula: does Not Testable §8.12, §9.8   Decided:
           count in denominator?                               exclude

  CQ-04    Gate default behavior: score \< 70 →  §7.3, §9.8    Decided: warn +
           block or warning? Config has                        override
           allow_user_override: true but rule 3                
           is ambiguous.                                       

  CQ-05    File size conflict: global 30MB vs    §9.6, §9.12,  Decided:
           per-tool (image 10 / xlsx 20 / doc    SEC-04        per-tool
           30). Which takes precedence?                        primary
  -------- ------------------------------------- ------------- ---------------

4.2 Medium --- clarify before generation

  -------- ------------------------------------- ------------- ---------------
  **ID**   **Question**                          **Spec ref**  **Status**

  CQ-06    Language output vs team convention:   A04, Q03      Decided:
           spec defaults EN but team uses                      default VI
           Vietnamese titles (\"Xác minh\...\").               
           Need title convention config field.                 

  CQ-07    Re-analyze behavior: creates new      §8.7          Open
           requirement version or overwrites v1?               
           What happens to user edits?                         

  CQ-08    Zero-gap path: gap_review is required §9.7, §15     Open
           user_action but if 0 gaps, does user                
           still click through or auto-advance?                

  CQ-09    Row actions undefined:                §8.11         Open
           \"Regenerate\", \"Improve expected                  
           result\", \"Split testcase\" --- how                
           do these differ? Does regenerate keep               
           user edits?                                         

  CQ-10    Cascade on unlock: requirement unlock §8.9          Open
           marks testcases \"Needs Review\" ---  FINAL-AC-05   
           does it also invalidate Coverage                    
           Matrix and existing Exports?                        

  CQ-11    Coverage gate placement:              §9.8          Open
           min_coverage_percent 80% blocks                     
           Export or just warns?                               
           testcase_approval_gate_v1 lists it                  
           but doesn\'t say block vs warn.                     
  -------- ------------------------------------- ------------- ---------------

4.3 Minor --- should be noted

  -------- --------------------------------------------- -------- ---------------
  **ID**   **Question**                                  **Spec   **Status**
                                                         ref**    

  CQ-12    ID format convention for REQ/GAP/TC not       §12      Open
           specified. Using REQ\_\<MOD\>\_\<NNN\> as              
           interim.                                               

  CQ-13    Budget hard_limit.enabled: false → AI keeps   §9.12    Open
           running past budget. Intentional?                      

  CQ-14    PII default mask_before_ai_call: false.       §9.12    Open
           Requirements may contain sensitive data.               
  -------- --------------------------------------------- -------- ---------------

5\. Phase overview

  --------------- --------------------------- ------------- ---------------
  **Phase**       **Objective**               **Map to      **Duration**
                                              MVP**         

  **0 ---         Repo, infra, contract,      ---           1 sprint (2
  Foundation**    vertical slice (Project                   weeks)
                  CRUD)                                     

  **1 --- Core    Happy path: Requirement →   MVP1 (§18.1)  3 sprints (6
  flow**          Testcase → Export                         weeks)

  **2 --- Config  Config UI, fallback, audit, MVP2 (§18.2)  2--3 sprints
  & robustness**  Figma, cost tracking                      (4--6 weeks)

  **3 --- Scale & Vault, pgvector, perf,      MVP3 (§18.3)  2 sprints (4
  polish**        hardening, role (if needed)               weeks)

  **4 ---         Playwright/Appium MCP,      Future        Backlog
  Automation**    Jira, CI/CD                 (§18.4)       
  --------------- --------------------------- ------------- ---------------

5.1 Dev A leads source setup

Dev A (Backend) sets up NestJS + Prisma + Docker first. Dev B (Frontend)
scaffolds Next.js in parallel. The critical handoff is the OpenAPI
contract (A0.3) on day 5--6 --- after which both devs run fully in
parallel.

  --------- ------------------------------- -------------------------------
  **Day**   **Dev A (NestJS)**              **Dev B (Next.js)**

  1--2      A0.1 NestJS scaffold + Docker   B0.1 Next.js scaffold + layout
            compose + Prisma init           shell (parallel)

  3--4      A0.2 Prisma schema + migrate    B0.1 cont. --- routing, design
                                            tokens, auth guard

  5--6      A0.3 OpenAPI contract + JSON    ⏳ Waits for contract
            schema → /contracts             

  6--7      A0.4 AI Gateway scaffold        B0.2 Receives contract → type
                                            gen + MSW mock → independent

  7--10     A0.5 Secret + A0.6 Project CRUD B0.3 + B0.4 Login + Dashboard +
                                            Project CRUD → wire real API
  --------- ------------------------------- -------------------------------

6\. Dev A --- Backend + AI/Workflow core

Ownership: NestJS backend, Prisma schema, AI Provider Gateway, Skill
Runtime Engine, Workflow Orchestrator, parsers, exporters, audit, cost,
secret management.

You are the critical path --- every frontend tab depends on your
skills/endpoints. Prioritize keeping the contract stable and flag schema
changes early.

6.1 Phase 0 --- Foundation (2 weeks)

  ------------- ------------------------ ------------------ -------------------------
  **Task**      **Build**                **Dependencies**   **Definition of Done**

  **A0.1 Repo + NestJS scaffold, CI/CD,  ---                docker compose up works,
  infra**       Docker compose (PG +                        CI green on PR
                Redis + MinIO), Prisma                      
                init                                        

  **A0.2 DB     Prisma schema: projects, A0.1               Migrate dev/deploy clean;
  core**        artifacts,                                  seed 1 project
                config_versions + enum                      
                status; prisma migrate                      

  **A0.3        OpenAPI spec (§13) +     A0.2               Schemas validate via ajv;
  Contract**    JSON schemas (§12).                         Dev B can mock from
                Commit to /contracts.                       OpenAPI
                Co-own with Dev B.                          

  **A0.4 AI     AiGatewayModule:         A0.3               1 real prompt returns
  Gateway**     AIProviderAdapter                           structured JSON;
                interface + OpenAI                          testConnection returns
                adapter +                                   {ok, models}
                test-connection endpoint                    

  **A0.5        Resolve secret_ref from  ---                GET provider never
  Secret**      env; mask on                                exposes real key
                response/log                                

  **A0.6        POST/GET/PATCH/DELETE    A0.2               Dev B creates/edits
  Project       /projects + default                         project via real API
  CRUD**        config override                             
  ------------- ------------------------ ------------------ -------------------------

6.2 Phase 1 --- Core flow / MVP1 (6 weeks)

  ------------------------ ------------------------------ ------------ -------------------------------------------
  **Task**                 **Build**                      **Dep**      **Definition of Done**

  **A1.1 Parser tools**    document_parser                A0.3         Each file type → parsed output; errors
                           (pdf/docx/txt),                             return reason (§14.1)
                           spreadsheet_parser (xlsx/csv),              
                           image_reader (vision) →                     
                           parsed_artifact_schema.                     
                           Per-tool size limits.                       

  **A1.2 Skill Runtime**   SkillRuntimeModule: load       A0.4         1 dummy skill e2e; log in ai_call_logs
                           config → prompt → model policy              
                           → AiGateway → ajv validate →                
                           retry                                       

  **A1.3                   parsed →                       A1.1, A1.2   Doc sample → ≥N items with
  requirement_reader**     requirement_schema_v1; split                id/module/feature/type/priority/testable;
                           atomic items; persist                       pass schema
                           requirement_versions + items                

  **A1.4 quality_checker** requirement → quality schema   A1.3         Score 0--100 + breakdown
                           (§12.2), 8 dimensions                       

  **A1.5 gap_detector**    requirement → gap schema       A1.3         Gaps have category from §8.8 list; each has
                           (§12.3); persist gap_items                  evidence + confidence
                           with                                        
                           severity/confidence/evidence                

  **A1.6                   gap resolution → new           A1.5         Each rewrite creates new version; API
  requirement_rewriter**   requirement version; store                  returns history + diff data
                           content_json +                              
                           content_markdown for diff                   

  **A1.7 Approval gate**   min_quality_score,             A1.4--A1.6   Approve when pass; warn on fail; override
                           block_if_open_gaps (§9.8);                  writes label; approved → locked
                           POST approve (lock). Warning +              
                           override.                                   

  **A1.8                   approved req + config (§8.10)  A1.7         Only approved generates; each TC has
  testcase_generator**     → testcase_schema; persist                  requirement_refs; pass schema
                           sets (with version_no) + cases              

  **A1.9                   Map req ↔ TC → coverage schema A1.8         Each req has status; coverage %
  coverage_checker**       (§12.5); persist                            auto-calculated
                           coverage_items; calc %                      
                           (exclude Not Testable)                      

  **A1.10 Excel Exporter** Sheet Test Cases (§8.13,       A1.9         Export .xlsx downloadable; history saved
                           template §9.10) → object                    
                           storage + export artifact                   
                           record                                      

  **A1.11 Workflow         BullMQ async, workflow_runs    A1.2         Full workflow runs; status transitions
  Orchestrator**           (§11.9), status transitions                 correct; has trace_id
                           (§7.2), on_success/on_failure,              
                           retry/cancel                                

  **A1.12 AI call logs**   ai_call_logs (§11.10):         A1.2         Every AI call logged; key never in log
                           provider/model/skill/prompt                 
                           version/tokens                              
  ------------------------ ------------------------------ ------------ -------------------------------------------

6.3 Phase 2 --- Config & robustness / MVP2 (4--6 weeks)

  ------------------- ------------------------------- -------------------------
  **Task**            **Build**                       **Definition of Done**

  **A2.1 Anthropic    Model policy primary/fallback   Primary fail → fallback
  adapter +           (§9.3, 10.4)                    runs; log shows which
  fallback**                                          provider used

  **A2.2 Prompt       CRUD + activate; 1 active per   Change prompt without
  versioning**        prompt name (§9.5)              deploy; old TC traces old
                                                      prompt version

  **A2.3 JSON         Retry → auto-repair → fallback  Invalid schema gets
  auto-repair +       → fail (§6.3)                   repaired/retried before
  fallback chain**                                    failing

  **A2.4 Quality gate Config-driven gate + override   Gate rules from config;
  engine**            flag (§9.8)                     override records label

  **A2.5 Audit log    Events §8.14, mask secret (§16) All important actions
  service**                                           logged; filter by
                                                      project/user/action

  **A2.6 Cost         Track by                        Cost by
  tracking**          project/provider/model; warning project/provider/model;
                      at 80% (§17)                    warning at threshold

  **A2.7 Skill        Figma API                       Figma error = warning
  figma_reader**      (read_file/nodes/export image), only, workflow continues
                      non-blocking (§10.7)            
  ------------------- ------------------------------- -------------------------

6.4 Phase 3 --- Scale & polish / MVP3 (4 weeks)

  ------------------- ------------------------------- -------------------
  **Task**            **Build**                       **Definition of
                                                      Done**

  **A3.1 Vault/KMS**  Production secret management +  Keys in Vault;
                      rotate                          rotate without
                                                      downtime

  **A3.2 pgvector**   Requirement chunks / semantic   Search returns
                      search                          relevant
                                                      requirement items

  **A3.3 Workflow     Load/validate workflow_versions Workflow
  builder config**                                    configurable
                                                      without code change

  **A3.4 Prompt       API endpoint for prompt diff    Compare two prompt
  version compare**                                   versions

  **A3.5 Cost         Aggregation endpoints           Data ready for
  dashboard data**                                    frontend charts

  **A3.6 Hardening**  Unit/integration tests,         Technical DoD met
                      trace_id, error states (§19.2)  
  ------------------- ------------------------------- -------------------

7\. Dev B --- Frontend (Next.js)

Ownership: All UI screens, BFF proxy layer, API client, state
management, mock setup. You are not blocked by Dev A: use MSW mock from
the OpenAPI contract until real endpoints are ready.

7.1 Phase 0 --- Foundation (2 weeks)

  --------------- ----------------------------- --------- -------------------------
  **Task**        **Build**                     **Dep**   **Definition of Done**

  **B0.1 FE       Next.js App Router scaffold,  ---       App runs, routing works
  skeleton**      route groups, layouts, design           between empty routes
                  system/tokens, auth guard               
                  (middleware)                            

  **B0.2 API      Type gen from OpenAPI         A0.3      Dev all screens with
  client + mock** (openapi-typescript/orval);             mock; switch to real API
                  MSW mock from schema §12;               via env flag
                  route handler proxy to NestJS           

  **B0.3 Login +  Login form (§8.1), dashboard  B0.1      Login redirects to
  Dashboard**     summary cards + empty state             Dashboard; no project →
                  (§8.2, §15)                             empty state

  **B0.4 Project  List + search/filter/sort     B0.2      Create project → redirect
  List +          (§8.3), form (§8.4), wire               to Project Detail;
  Create/Edit**   real API                                validation works
  --------------- ----------------------------- --------- -------------------------

7.2 Phase 1 --- Core flow / MVP1 (6 weeks)

  --------------- ------------------------------------------ --------- ---------------------------------------
  **Task**        **Build**                                  **Dep**   **Definition of Done**

  **B1.1 Project  Header + 7-step stepper + tab nav + step   B0.4      Tab switch preserves state; status
  Detail layout** status (§8.5)                                        displays correctly

  **B1.2 Tab      Upload (drag/drop), paste text, Figma URL, B1.1      Upload/parse shows status; file error
  Input**         UI screenshot; artifact table; parse                 shows reason; Figma error = warning
                  status; error states (§8.6, §14.1)                   only

  **B1.3          Reusable hook: poll/SSE workflow_runs      B0.2      One hook reused across
  Job-status      status (§7.2) for all AI steps                       Analyze/Gap/Rewrite/Generate/Coverage
  hook**                                                               

  **B1.4 Tab      Source preview + structured items          B1.3      Edit item saves; score shows breakdown;
  Analyze**       (edit/add/delete) + quality score panel              re-analyze triggers job
                  (§8.7)                                               

  **B1.5 Tab Gap  Summary cards, gap table + filter          B1.3      Resolve gap updates status;
  Review**        (severity/category/status), detail drawer,           Critical/High unresolved shows warning
                  resolve/answer/accept/reject (§8.8)                  

  **B1.6 Tab      Version selector + diff viewer + approve + B1.5      Diff between versions; approve locks;
  Final           lock status (§8.9)                                   unlock marks TC \"Needs Review\"
  Requirement**                                                        

  **B1.7 Tab      Config form:                               B1.6      Only approved requirement allows
  Testcase        template/language/scope/detail/types/max             generate; submit creates job
  Generation**    (§8.10)                                              

  **B1.8 Testcase Grid: inline edit, filter                  B1.3      Edit cell saves; filter/search works;
  Review Table    (module/feature/priority/type/status),               each row traces requirement
  ⚠️**            search, freeze first cols (§8.11)                    

  **B1.9 Tab      Summary cards + coverage table + status    B1.8      Shows
  Coverage        badge (§8.12)                                        covered/partial/missing/not-testable;
  Matrix**                                                             missing shows warning

  **B1.10 Tab     Export options + trigger + download +      B1.9      Export downloads file; history
  Export**        history table (§8.13)                                displays; failed shows reason
  --------------- ------------------------------------------ --------- ---------------------------------------

7.3 Phase 2 --- Config & robustness / MVP2 (4--6 weeks)

  ------------------- ------------------------------------------ ----------------------
  **Task**            **Build**                                  **Definition of Done**

  **B2.1 Config       Config navigation (§9.1)                   Navigate between
  shell + nav**                                                  config groups

  **B2.2 Config:      Provider form (secret masked, Test         Secret hidden after
  Providers /         Connection), model policy                  save; test connection
  Policies / Gates**  (primary/fallback), quality gate           shows result
                      (§9.2--9.3, §9.8)                          

  **B2.3 Config:      Prompt (version + activate), TC/export     Only 1 prompt
  Prompts / Templates template, skills (edit), tools (read-only) active/name; future
  / Skills / Tools**  (§9.4--9.6, §9.9--9.10)                    tools show disabled

  **B2.4 Testcase     Bulk actions                               Bulk + per-row works;
  table advanced**    (approve/reject/delete/regenerate/export   regenerate keeps
                      selected) + row actions (§8.11)            requirement trace

  **B2.5 Audit Log    Audit log table + filter (§8.14)           Filter by
  screen**                                                       project/user/action;
                                                                 no secret shown

  **B2.6 Figma        Figma input UI, coverage gate warning, all Figma error
  context + polish**  error/empty states (§14, §15)              non-blocking; all
                                                                 states implemented

  **B2.7 Cost         Basic cost display on Dashboard (if cost   Shows when enabled;
  indicator**         tracking enabled)                          hidden when disabled
  ------------------- ------------------------------------------ ----------------------

7.4 Phase 3 --- Scale & polish / MVP3 (4 weeks)

  ------------------- ------------------------------- -------------------
  **Task**            **Build**                       **Definition of
                                                      Done**

  **B3.1 AI Cost      Charts by                       Charts render with
  Dashboard**         project/provider/model (§17.2)  real data

  **B3.2 Prompt       Side-by-side prompt diff        Two versions
  version compare                                     displayed with
  UI**                                                differences
                                                      highlighted

  **B3.3 Virtualized  Performance for large testcase  Table smooth with
  grid**              sets                            500+ rows

  **B3.4 Advanced     Advanced filters, accessibility Functional DoD
  audit + a11y**      pass, workspace/role UI if      (§19.1) met
                      needed                          
  ------------------- ------------------------------- -------------------

8\. Sync protocol between Dev A and Dev B

8.1 Contract-first workflow

-   Dev A owns the OpenAPI spec + JSON schemas in the shared /contracts
    directory.

-   Dev B generates TypeScript types and MSW mocks from this contract.

-   Any schema change by Dev A must be communicated before merge. Dev B
    regenerates types after.

-   Contract v1 is frozen at end of Phase 0. Breaking changes require
    explicit agreement.

8.2 Endpoint delivery order

Dev B needs endpoints in this order. Dev A should prioritize
accordingly:

1.  Project CRUD (Phase 0)

2.  Artifact upload + parse (Phase 1, week 1--2)

3.  Analyze requirement + quality score (Phase 1, week 2--3)

4.  Gap detect + CRUD (Phase 1, week 3--4)

5.  Rewrite + diff + approve (Phase 1, week 4--5)

6.  Testcase generate + CRUD (Phase 1, week 5)

7.  Coverage check (Phase 1, week 5--6)

8.  Export Excel (Phase 1, week 6)

8.3 Weekly sync

-   Brief 15-min standup at start of each week.

-   Demo at end of each sprint (every 2 weeks).

-   PR review: each dev reviews the other\'s PR when it touches shared
    contract.

9\. Risks and mitigation

  ----------------- ---------------- ------------ -------------------------------------
  **Risk**          **Likelihood**   **Impact**   **Mitigation**

  AI structured     High             High         ajv validation + retry +
  output unreliable                               auto-repair + fallback model. Build
  (invalid JSON)                                  into A1.2, harden in A2.3.

  Testcase Review   Medium           High         Use TanStack Table or AG Grid. Do not
  Table complexity                                custom-build grid. Start early in
  (B1.8)                                          Phase 1.

  Dev A is critical High             High         Contract-first + MSW mock lets Dev B
  path bottleneck                                 proceed independently. Dev A
                                                  prioritizes endpoints in delivery
                                                  order.

  BA spec has       Medium           Medium       Implement sensible defaults. Confirm
  unresolved open                                 with BA/PO within Phase 1 sprint 1.
  questions                                       
  (CQ-07--CQ-14)                                  

  Scope creep:      Low              High         Plan explicitly defers to Phase 3. If
  multi-user/role                                 required earlier, add 1--2 sprints.
  demanded early                                  

  AI provider rate  Medium           Medium       BullMQ queue with rate limiting.
  limits / cost                                   Budget warning at 80%. Hard limit
  overrun                                         configurable.
  ----------------- ---------------- ------------ -------------------------------------

10\. High-level architecture

The system follows a layered architecture with clear separation between
frontend, backend services, AI gateway, and external providers.

Frontend layer

-   Next.js App Router: pages, components, hooks, state (TanStack
    Query).

-   BFF: Next.js route handlers proxy to NestJS. Holds session, never
    exposes secrets to client.

Backend layer (NestJS)

-   Module-per-domain: ProjectModule, ArtifactModule, RequirementModule,
    GapModule, TestcaseModule, CoverageModule, ExportModule,
    ConfigModule, AuditModule.

-   WorkflowOrchestratorModule: BullMQ jobs, status tracking,
    retry/cancel.

-   SkillRuntimeModule: loads skill config → prompt template → model
    policy → calls AI Gateway → validates output via ajv.

-   AiGatewayModule: provider adapters (OpenAI, Anthropic, Gemini).
    Fallback chain. Cost/token logging.

Data layer

-   PostgreSQL via Prisma: all domain entities (projects, requirements,
    gaps, testcases, coverage, config, audit).

-   Redis: BullMQ job queue, optional caching.

-   Object Storage (MinIO/S3): uploaded files, export artifacts.

-   Vault/KMS (Phase 3): secret management.

External integrations

-   AI Providers: OpenAI API, Anthropic Messages API, Gemini API.

-   Figma API: read file/nodes, export images (optional, non-blocking).

-   Future: Playwright MCP, Appium MCP, Jira, TestRail, CI/CD.

11\. Definition of done

11.1 Functional DoD (per spec §19.1)

  -------- ------------------------------------------------------------------
  **\#**   **Criteria**

  1        User creates project

  2        User uploads/pastes requirement

  3        System parses input

  4        System analyzes requirement into structured items

  5        System shows quality score

  6        System detects gaps

  7        User resolves gaps

  8        System rewrites final requirement

  9        User approves requirement

  10       User configures and generates testcases

  11       User views/edits testcase table

  12       System shows coverage matrix

  13       User approves testcase set

  14       User exports Excel

  15       Admin configures AI provider/model/skill/prompt/template

  16       System logs audit trail
  -------- ------------------------------------------------------------------

11.2 Technical DoD (per spec §19.2)

  -------- ------------------------------------------------------------------
  **\#**   **Criteria**

  1        AI output validated by JSON schema (ajv)

  2        Retry + fallback provider on failure

  3        API key never exposed to frontend

  4        Workflow runs async (BullMQ)

  5        Job status clear and queryable

  6        trace_id on every workflow run

  7        Versioning on requirement, testcase set, prompt, skill, workflow,
           export template

  8        Export file saved as artifact

  9        Unit/integration tests for core services

  10       Error states complete (§14)
  -------- ------------------------------------------------------------------

12\. Appendix: NestJS module mapping

Recommended module structure for the NestJS backend:

  -------------------- -------------- ----------------------- ---------------------------
  **NestJS Module**    **Spec         **Core Entities**       **Key Endpoints**
                       Section**                              

  ProjectModule        §8.3--8.4,     projects                POST/GET/PATCH/DELETE
                       §11.1                                  /projects

  ArtifactModule       §8.6, §11.2    artifacts               POST
                                                              /projects/{id}/artifacts,
                                                              POST /artifacts/{id}/parse

  RequirementModule    §8.7--8.9,     requirement_versions,   GET versions, PATCH items,
                       §11.3--11.4    requirement_items       POST rewrite, POST approve

  GapModule            §8.8, §11.5    gap_items               GET gaps, PATCH gap, POST
                                                              resolve/reopen

  TestcaseModule       §8.10--8.11,   testcase_sets,          POST generate, GET set,
                       §11.6--11.7    test_cases              PATCH case, POST approve

  CoverageModule       §8.12, §11.8   coverage_items          GET coverage, POST recheck

  ExportModule         §8.13          export artifacts        POST export/excel, GET
                                                              download, GET history

  ConfigModule         §9.1--9.12,    config_versions         All /configs/\* endpoints
                       §11.11                                 

  AuditModule          §8.14, §11.10  audit_logs,             GET /audit-logs, GET
                                      ai_call_logs            /ai-call-logs

  WorkflowModule       §9.7, §11.9    workflow_runs           POST run, GET status, POST
                                                              retry/cancel

  AiGatewayModule      §10, §9.2      ---                     Internal: called by
                                                              SkillRuntime

  SkillRuntimeModule   §9.4           ---                     Internal: called by
                                                              WorkflowModule

  AuthModule           §8.1           ---                     POST /auth/login, /logout,
                                                              GET /me
  -------------------- -------------- ----------------------- ---------------------------

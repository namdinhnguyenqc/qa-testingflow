# QAFlow AI Agent Architecture Notes

## Product Architecture

QAFlow AI is a multi-workflow QA platform, not a single manual-testcase tool. The platform shares one Requirement Understanding Layer across:

- Manual QA.
- Automation QA.
- API QA.
- Performance QA.
- Shared Evaluation, History, and Reports.

## Core Engine vs Custom Skill

Core code owns workflow execution, persistence, artifact versioning, validation, runtime safety, UI, and external integrations.

Custom behavior belongs in Git-versioned files:

- Skills: `.md`
- Schemas: `.json`
- Templates: `.md` or structured template files

Skills define how requirements are read, how testcase formats are produced, which automation conventions apply, and what API/performance rules are expected. Agents must not hard-code team-specific QA policy into UI or infrastructure code when a skill/schema/template can own it.

## Model And Tool Boundaries

Model providers are adapter-based. Team and production modes must not silently fall back to mock outputs.

MCP is a protocol for AI/tool interaction. MCP is not a model provider and not an output framework. Browser tools must be accessed through a tool adapter boundary, not directly from workflow logic.

Preferred browser boundary:

- `BrowserToolAdapter`
- `PlaywrightMcpAdapter` as first provider
- `SeleniumMcpAdapter` as future provider

Exploration Tool choice and Automation Output Profile choice are independent.

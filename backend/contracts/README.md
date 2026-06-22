# Contracts

Shared OpenAPI and JSON Schema files live here. Dev B should generate frontend types and MSW mocks from these files.

- `openapi.yaml`: API contract.
- `schemas/*.schema.json`: AI output schemas validated by ajv.

Validate the contract locally with:

```powershell
npm run contract:validate
```

Phase 0 contract v1 includes endpoint skeletons for Project CRUD, artifact parsing, requirement analysis, quality, gaps, rewrite/approval, testcase generation, coverage, export, workflow status, audit logs, AI call logs, and AI provider connection testing.

# Local Configuration Checklist

This backend is initialized for Dev A foundation work.

## Already configured for local development

- Database runs on Supabase Postgres.
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- MinIO endpoint: `http://localhost:9000`
- MinIO console: `http://localhost:9001`
- MinIO access key: `minioadmin`
- MinIO secret key: `minioadmin`
- S3 bucket name: `ai-qa-artifacts`
- Default model: `gpt-4.1-mini`
- Default language: `vi`

## Required before running the full stack

- Create a Supabase project.
- Copy the Supabase Postgres connection string into `DATABASE_URL` in `.env`.
- Install Docker Desktop for local Redis and MinIO.
- Set `OPENAI_API_KEY` before testing real AI calls.

## Supabase database config

Current Supabase project is configured as:

```text
postgresql://postgres.ymktjlyewbqsgkwyrjbr:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require&uselibpqcompat=true&schema=aiqa_dev&options=-c%20search_path%3Daiqa_dev
```

Replace `<PASSWORD>` or `[YOUR-PASSWORD]` in `.env` with the real database password before running migrations.
The database already has public tables, so this backend uses the dedicated schema `aiqa_dev`.

Reference formats from Supabase Project Settings -> Database:

```text
postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

or the direct connection string:

```text
postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

For local development, the pooler string is usually friendlier. For Prisma migrations, if pooler causes migration issues, temporarily use the direct connection string.

## Current defaults

- API port: `3000`
- Swagger: `http://localhost:3000/api/docs`
- Health: `http://localhost:3000/api/health`
- Config summary: `http://localhost:3000/api/config/summary`
- OpenAI test connection: `POST http://localhost:3000/api/configs/ai-providers/openai/test-connection`
- Default language: Vietnamese (`vi`)
- Gate behavior: warning + override
- Coverage denominator: excludes `not-testable`
- File limits:
  - Image: 10 MB
  - XLSX: 20 MB
  - DOC/PDF/TXT: 30 MB
  - Global cap: 30 MB

## First run once Supabase and Docker are available

```powershell
cd C:\Users\PC\Documents\qatesting\backend
docker compose up -d
npm run prisma:migrate -- --name init_core
npm run seed
npm run start:dev
```

## Phase 0 status

- A0.2 DB schema: done in Supabase schema `aiqa_dev`.
- A0.3 Contract + JSON schemas: done as Phase 1 skeleton and schema validation script.
- A0.4 AI Gateway scaffold: done for OpenAI.
- A0.5 Secret masking: done for env-backed secret refs.
- A0.6 Project CRUD: done.

`OPENAI_API_KEY` is still required before the OpenAI connection endpoint can return `ok: true`.

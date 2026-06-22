# AI QA Platform

AI-powered requirement analysis and testcase generation platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| File Storage | MinIO (local) / S3-compatible (production) |
| AI | OpenAI GPT-4 |

## Project Structure

```
qa-testingflow/
├── frontend/          # Next.js app (port 3000)
├── backend/           # NestJS API (port 3001)
├── contracts/         # OpenAPI spec
└── docker-compose.yml # Local dev services
```

## Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop

### 1. Start infrastructure

```bash
docker compose up -d
```

Starts PostgreSQL (5432), Redis (6379), MinIO (9000).

### 2. Setup backend

```bash
cd backend
cp .env.example .env
# Edit .env — DATABASE_URL is pre-filled for local Docker

npm install
npx prisma migrate dev --name init
npx prisma db seed        # creates admin@gmail.com
npm run start:dev         # → http://localhost:3001
```

### 3. Setup frontend

```bash
cd frontend
npm install
npm run dev               # → http://localhost:3000
```

### Default credentials

```
Email:    admin@gmail.com
Password: Abc@1234
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | local Docker |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | `http://localhost:9000` |
| `S3_BUCKET` | Storage bucket name | `ai-qa-artifacts` |
| `OPENAI_API_KEY` | OpenAI API key | required for AI features |
| `OPENAI_DEFAULT_MODEL` | Default model | `gpt-4.1-mini` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001/api` |
| `NEXT_PUBLIC_API_MOCK` | Use mock data (no backend needed) | `true` |
| `BACKEND_URL` | Server-side backend URL | `http://localhost:3001/api` |

> Set `NEXT_PUBLIC_API_MOCK=true` to run frontend without backend (uses mock data).

## Production Deployment

### Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy the connection string from **Project Settings → Database → URI**
3. Set `DATABASE_URL` in your deployment environment
4. Run migrations and seed:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### MinIO → AWS S3

Replace MinIO env vars with S3 credentials:

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=ap-southeast-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_FORCE_PATH_STYLE=false
```

## Development Notes

- **Mock mode**: Frontend can run standalone with `NEXT_PUBLIC_API_MOCK=true` — no backend or database needed
- **Auth**: Simple email/password stored in PostgreSQL with bcrypt hashing
- **File uploads**: Stored in MinIO locally, S3-compatible in production
- **AI workflows**: Async via BullMQ queue — requires Redis and valid `OPENAI_API_KEY`

## Contributors

- **Dev A** — Backend (NestJS, Prisma, AI workflows)
- **Dev B** — Frontend (Next.js, UI components, mock layer)

# Senior Code Review Report â€” AI QA Platform (Phase 0)

ChÃ o **Dev A**, tÃ´i Ä‘Ã£ review toÃ n bá»™ codebase NestJS hiá»‡n táº¡i cá»§a báº¡n dá»±a trÃªn tÃ i liá»‡u **Master Plan** vÃ  káº¿ hoáº¡ch triá»ƒn khai cá»§a Phase 0. DÆ°á»›i Ä‘Ã¢y lÃ  Ä‘Ã¡nh giÃ¡ chuyÃªn sÃ¢u vÃ  chi tiáº¿t tá»« gÃ³c nhÃ¬n cá»§a má»™t Senior Software Engineer nháº±m giÃºp há»‡ thá»‘ng cá»§a chÃºng ta tá»‘i Æ°u hÆ¡n vá» **hiá»‡u nÄƒng**, **báº£o máº­t**, vÃ  **kháº£ nÄƒng má»Ÿ rá»™ng (scalability)** trÆ°á»›c khi báº¯t Ä‘áº§u Phase 1.

---

## 1. ÄÃ¡nh giÃ¡ tá»•ng quan

*   **Tiáº¿n Ä‘á»™ & Káº¿t quáº£ (Phase 0):** HoÃ n thÃ nh **xuáº¥t sáº¯c** má»¥c tiÃªu Phase 0. Cáº¥u trÃºc khung dá»± Ã¡n NestJS ráº¥t chuáº©n chá»‰, Prisma Client hoáº¡t Ä‘á»™ng tá»‘t, Docker Compose (Postgres + Redis + MinIO) Ä‘Ã£ Ä‘Æ°á»£c thiáº¿t láº­p Ä‘áº§y Ä‘á»§.
*   **Cháº¥t lÆ°á»£ng Code:** Code sáº¡ch, viáº¿t gá»n gÃ ng, chia module rÃµ rÃ ng (domain-driven). Tá»· lá»‡ phá»§ test tá»‘t (toÃ n bá»™ unit tests vÃ  E2E tests Ä‘á»u cháº¡y **PASS** vá»›i `npm run verify`).
*   **Thiáº¿t káº¿ API Contract:** Viá»‡c viáº¿t OpenAPI spec (`openapi.yaml`) vÃ  JSON Schemas trong thÆ° má»¥c `/contracts` lÃ  Ä‘iá»ƒm cá»™ng lá»›n, giÃºp Dev B (Frontend) cÃ³ thá»ƒ lÃ m viá»‡c song song má»™t cÃ¡ch Ä‘á»™c láº­p thÃ´ng qua Mock Service Worker (MSW).

Tuy nhiÃªn, cÃ³ má»™t sá»‘ Ä‘iá»ƒm cáº§n cáº£i thiá»‡n ngay láº­p tá»©c liÃªn quan Ä‘áº¿n **DB Queries**, **Security (Masking)**, vÃ  **Robustness (AI integration)**.

---

## 2. Review chi tiáº¿t & Äá» xuáº¥t cáº£i tiáº¿n

### 2.1. Prisma & DB Connection (`prisma.service.ts`)
*   **Váº¥n Ä‘á» (Import Path):**
    Táº¡i dÃ²ng 4 trong [prisma.service.ts](file:///c:/Users/PC/Documents/qatesting/backend/src/prisma/prisma.service.ts#L4) vÃ  dÃ²ng 2 trong [projects.service.ts](file:///c:/Users/PC/Documents/qatesting/backend/src/projects/projects.service.ts#L2):
    ```typescript
    import { PrismaClient } from '../../node_modules/.prisma/client';
    ```
    ÄÃ¢y lÃ  má»™t **code smell**. Viá»‡c trá» trá»±c tiáº¿p vÃ o thÆ° má»¥c `node_modules` lÃ  khÃ´ng an toÃ n vÃ¬ cáº¥u trÃºc thÆ° má»¥c nÃ y cÃ³ thá»ƒ thay Ä‘á»•i tÃ¹y thuá»™c vÃ o mÃ´i trÆ°á»ng deploy, cache cá»§a CI/CD, hoáº·c trÃ¬nh quáº£n lÃ½ package (npm, pnpm, yarn).
*   **Giáº£i phÃ¡p:**
    Sá»­ dá»¥ng import chuáº©n tá»« `@prisma/client`. TrÃ¬nh build TypeScript vÃ  Prisma generator sáº½ tá»± Ä‘á»™ng phÃ¢n giáº£i Ä‘Ãºng Ä‘Æ°á»ng dáº«n:
    ```typescript
    import { PrismaClient, Prisma } from '@prisma/client';
    ```

---

### 2.2. Tá»‘i Æ°u hÃ³a Database Queries (`projects.service.ts`)
*   **Váº¥n Ä‘á» (Unnecessary Queries):**
    Trong cÃ¡c phÆ°Æ¡ng thá»©c `update` vÃ  `remove` táº¡i [projects.service.ts](file:///c:/Users/PC/Documents/qatesting/backend/src/projects/projects.service.ts#L40-L59), báº¡n Ä‘ang gá»i `await this.ensureExists(id)` trÆ°á»›c khi gá»i `update`/`delete`:
    ```typescript
    async update(id: string, dto: UpdateProjectDto) {
      await this.ensureExists(id); // Gá»i SELECT COUNT(*)
      return this.prisma.project.update({ ... }); // Gá»i UPDATE
    }
    ```
    CÃ¡ch viáº¿t nÃ y khiáº¿n á»©ng dá»¥ng pháº£i thá»±c hiá»‡n **2 truy váº¥n tuáº§n tá»± tá»›i Database** cho má»—i thao tÃ¡c cáº­p nháº­t/xÃ³a, gÃ¢y giáº£m hiá»‡u nÄƒng khi táº£i cao.
*   **Giáº£i phÃ¡p:**
    Prisma sáº½ tá»± Ä‘á»™ng nÃ©m lá»—i `RecordNotFound` vá»›i mÃ£ lá»—i `P2025` náº¿u báº£n ghi khÃ´ng tá»“n táº¡i. HÃ£y thá»±c hiá»‡n trá»±c tiáº¿p thao tÃ¡c ghi vÃ  báº¯t lá»—i nÃ y:
    ```typescript
    import { Prisma } from '@prisma/client';

    async update(id: string, dto: UpdateProjectDto) {
      try {
        return await this.prisma.project.update({
          where: { id },
          data: {
            name: dto.name,
            description: dto.description,
            defaultLanguage: dto.defaultLanguage,
            configOverrides: dto.configOverrides as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException(`Project ${id} was not found`);
        }
        throw error;
      }
    }

    async remove(id: string) {
      try {
        await this.prisma.project.delete({ where: { id } });
        return { deleted: true, id };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException(`Project ${id} was not found`);
        }
        throw error;
      }
    }
    ```

---

### 2.3. Lá»— há»•ng rÃ² rá»‰ dá»¯ liá»‡u nháº¡y cáº£m trong thuáº­t toÃ¡n Masking (`secrets.service.ts`)
*   **Váº¥n Ä‘á» (Weak Masking):**
    PhÆ°Æ¡ng thá»©c `mask` táº¡i [secrets.service.ts](file:///c:/Users/PC/Documents/qatesting/backend/src/secrets/secrets.service.ts#L21-L31):
    ```typescript
    mask(value?: string | null): string | null {
      // ...
      if (value.length <= 8) return '********';
      return `${value.slice(0, 4)}...${value.slice(-4)}`;
    }
    ```
    Náº¿u má»™t secret (cháº³ng háº¡n API Key tá»± Ä‘á»‹nh nghÄ©a ngáº¯n hoáº·c chuá»—i kÃ½ tá»± kiá»ƒm thá»­) cÃ³ Ä‘á»™ dÃ i **9 kÃ½ tá»±** (vÃ­ dá»¥: `SK-1234-A`), hÃ m sáº½ tráº£ vá» `SK-1...34-A`. Báº¡n Ä‘Ã£ Ä‘á»ƒ lá»™ **8/9 kÃ½ tá»±** cá»§a khÃ³a máº­t, chá»‰ che Ä‘Ãºng 1 dáº¥u cháº¥m á»Ÿ giá»¯a! Äiá»u nÃ y ráº¥t nguy hiá»ƒm náº¿u Ã¡p dá»¥ng cho máº­t kháº©u hay token ngáº¯n.
*   **Giáº£i phÃ¡p:**
    Tá»‘i Æ°u láº¡i thuáº­t toÃ¡n che giáº¥u thÃ´ng tin. Chá»‰ hiá»ƒn thá»‹ kÃ½ tá»± Ä‘áº§u/cuá»‘i náº¿u chuá»—i thá»±c sá»± dÃ i (vÃ­ dá»¥: > 16 kÃ½ tá»±). Vá»›i cÃ¡c chuá»—i ngáº¯n hÆ¡n, hÃ£y che hoÃ n toÃ n hoáº·c chá»‰ hiá»ƒn thá»‹ tá»‘i Ä‘a 2 kÃ½ tá»± Ä‘áº§u:
    ```typescript
    mask(value?: string | null): string | null {
      if (!value) return null;
      if (value.length <= 12) {
        return '********';
      }
      // VÃ­ dá»¥ vá»›i API Key dÃ i (thÆ°á»ng > 32 kÃ½ tá»±), chá»‰ lá»™ 4 kÃ½ tá»± Ä‘áº§u vÃ  4 kÃ½ tá»± cuá»‘i
      return `${value.slice(0, 4)}...${value.slice(-4)}`;
    }
    ```

---

### 2.4. Kháº£ nÄƒng chá»‹u lá»—i (Robustness) khi tÃ­ch há»£p AI (`openai.adapter.ts`)
*   **Váº¥n Ä‘á» 1 (Thiáº¿u Timeout cho Network Request):**
    Táº¡i [openai.adapter.ts](file:///c:/Users/PC/Documents/qatesting/backend/src/ai-gateway/adapters/openai.adapter.ts#L27), báº¡n dÃ¹ng `fetch()` gá»i tháº³ng tá»›i API OpenAI mÃ  khÃ´ng cáº¥u hÃ¬nh timeout. Náº¿u OpenAI bá»‹ suy giáº£m hiá»‡u nÄƒng hoáº·c gáº·p sá»± cá»‘ máº¡ng (network hang), request nÃ y cÃ³ thá»ƒ bá»‹ treo vÃ´ háº¡n, chiáº¿m dá»¥ng connection pool vÃ  lÃ m Ä‘Æ¡ luá»“ng xá»­ lÃ½ chÃ­nh cá»§a server hoáº·c job queue.
*   **Giáº£i phÃ¡p:**
    LuÃ´n Ä‘áº·t thá»i háº¡n tá»‘i Ä‘a (timeout) cho cÃ¡c cuá»™c gá»i bÃªn thá»© ba báº±ng cÃ¡ch sá»­ dá»¥ng `AbortController` (vÃ­ dá»¥: tá»‘i Ä‘a 10-15 giÃ¢y):
    ```typescript
    async testConnection(): Promise<TestConnectionResult> {
      const apiKey = this.secretsService.resolve(this.secretRef);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        
        const body = (await response.json().catch(() => ({}))) as OpenAIModelListResponse;
        // ... xá»­ lÃ½ tiáº¿p ...
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new ServiceUnavailableException('OpenAI API request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }
    ```

*   **Váº¥n Ä‘á» 2 (Lá»c Model List cho UI):**
    HÃ m `testConnection()` Ä‘ang tráº£ vá» toÃ n bá»™ model láº¥y Ä‘Æ°á»£c tá»« OpenAI (gá»“m `whisper`, `dall-e`, `embedding`, v.v.). Äiá»u nÃ y sáº½ khiáº¿n Frontend cá»§a Dev B hiá»ƒn thá»‹ má»™t dropdown danh sÃ¡ch cáº¥u hÃ¬nh model vÃ´ cÃ¹ng há»—n loáº¡n vÃ  khÃ³ chá»n.
*   **Giáº£i phÃ¡p:**
    Chá»‰ nÃªn filter cÃ¡c model há»¯u dá»¥ng cho tÃ¡c vá»¥ Chat Completion/QA (vÃ­ dá»¥: báº¯t Ä‘áº§u báº±ng `gpt-` hoáº·c `o1-`):
    ```typescript
    const models = (body.data ?? [])
      .map((model) => model.id)
      .filter((model): model is string => Boolean(model) && (model.startsWith('gpt-') || model.startsWith('o1-')))
      .sort();
    ```

*   **Váº¥n Ä‘á» 3 (Vi pháº¡m SOLID - Open/Closed Principle):**
    Táº¡i [ai-gateway.service.ts](file:///c:/Users/PC/Documents/qatesting/backend/src/ai-gateway/ai-gateway.service.ts#L11-L32), service Ä‘ang inject trá»±c tiáº¿p `OpenAIAdapter` vÃ  kiá»ƒm tra logic dáº¡ng:
    ```typescript
    if (providerId === 'openai') return this.openAIAdapter;
    ```
    Khi sang Phase 2 bá»• sung Anthropic vÃ  Gemini, báº¡n sáº½ pháº£i liÃªn tá»¥c thay Ä‘á»•i code táº¡i file nÃ y Ä‘á»ƒ inject thÃªm adapter vÃ  viáº¿t thÃªm nhÃ¡nh `else if`.
*   **Giáº£i phÃ¡p:**
    Thiáº¿t káº¿ láº¡i lá»›p theo dáº¡ng Registry hoáº·c inject táº¥t cáº£ adapter thÃ´ng qua má»™t token chung (Multi-provider injection), hoáº·c Ä‘Äƒng kÃ½ Ä‘á»™ng cÃ¡c adapter vÃ o má»™t Map Ä‘á»ƒ `AiGatewayService` khÃ´ng bá»‹ phá»¥ thuá»™c cá»©ng vÃ o tá»«ng adapter cá»¥ thá»ƒ.

---

## 3. Kiáº¿n nghá»‹ vÃ  chuáº©n bá»‹ cho Phase 1

Phase 1 lÃ  **trá»ng tÃ¢m cá»‘t lÃµi** cá»§a há»‡ thá»‘ng (6 tuáº§n) vá»›i cÃ¡c tÃ¡c vá»¥ phÃ¢n tÃ­ch, phÃ¡t hiá»‡n Gap vÃ  táº¡o Testcase qua AI. Äá»ƒ trÃ¡nh ná»£ ká»¹ thuáº­t (technical debt):

1.  **Strict Schema Validation:** Má»i response tá»« AI báº¯t buá»™c pháº£i dÃ¹ng `ajv` kiá»ƒm tra cháº·t cháº½ theo JSON Schema Ä‘Ã£ chá»‘t á»Ÿ thÆ° má»¥c `/contracts/schemas`. Náº¿u sai, Ã¡p dá»¥ng cÆ¡ cháº¿ retry ngay táº¡i táº§ng `SkillRuntime`.
2.  **BullMQ Async Design:** CÃ¡c endpoint báº¯t Ä‘áº§u báº±ng phÃ¢n tÃ­ch requirement (`/requirements/analyze`), táº¡o testcase (`/testcase-sets`), kiá»ƒm tra coverage (`/coverage`) Ä‘á»u cáº§n tráº£ vá» **HTTP 202 Accepted** kÃ¨m thÃ´ng tin `WorkflowRun` ngay láº­p tá»©c. Sau Ä‘Ã³ Ä‘áº©y job vÃ o queue cháº¡y ngáº§m Ä‘á»ƒ trÃ¡nh timeout HTTP.
3.  **Trace ID xuyÃªn suá»‘t:** Táº¡o má»™t `traceId` duy nháº¥t táº¡i thá»i Ä‘iá»ƒm báº¯t Ä‘áº§u workflow vÃ  truyá»n nÃ³ xuá»‘ng qua cÃ¡c cuá»™c gá»i AI (`AiCallLog`) vÃ  hoáº¡t Ä‘á»™ng nghiá»‡p vá»¥ (`AuditLog`) Ä‘á»ƒ dá»… dÃ ng giÃ¡m sÃ¡t lá»—i há»‡ thá»‘ng sau nÃ y.

---
*BÃ¡o cÃ¡o Ä‘Æ°á»£c thá»±c hiá»‡n bá»Ÿi Senior Software Engineer cá»§a báº¡n. HÃ£y tick chá»n cÃ¡c cáº£i tiáº¿n trÃªn khi báº¡n thá»±c hiá»‡n.*

---

## Remediation status

- [x] Removed extra `ensureExists()` query from Project update/delete. Missing records are now mapped from Prisma `P2025` to `NotFoundException`.
- [x] Strengthened secret masking so short values (`<= 12`) are fully masked.
- [x] Added OpenAI request timeout via `AbortController`.
- [x] Filtered OpenAI model list to QA/chat-suitable model families.
- [x] Refactored AI Gateway provider lookup into an adapter registry.
- [ ] Prisma import from `node_modules/.prisma/client` remains as a temporary Prisma 7 workaround. In this repo, `@prisma/client` currently does not expose `PrismaClient` in its wrapper d.ts after generation, so switching imports back breaks TypeScript build.

Verification after remediation:

```powershell
npm run verify
```

Result: pass.

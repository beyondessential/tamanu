# Ask AI Chatbot — Implementation Plan

## Context

Tamanu end users need help understanding the system — "Can I book recurring appointments?", "Why am I getting this error?" — without needing to raise a support ticket. This feature adds an "Ask AI" chatbot panel to the Tamanu sidebar that answers questions about Tamanu's features and known errors using RAG over indexed codebase and documentation content. It has no access to live Tamanu data in this iteration.

**Next iteration** (out of scope now): admin-only access to logs, settings, and config files for deeper debugging.

## Architecture

- **RAG**: github-repo-rag Python sidecar populates a `rag` schema in Tamanu's existing Postgres DB using pgvector. Tamanu's Node.js server queries it directly with raw SQL, embedding the user's query via Voyage AI.
- **LLM interaction**: Managed via BAML (BoundaryML) — `.baml` files define prompts and structured response types, generating type-safe TypeScript clients.
- **Agent definition**: GitAgent standard — `SOUL.md`, `SKILL.md`, and `agent.yaml` files define the agent's identity and capabilities in version control.
- **LLM calls**: Server-side via `@anthropic-ai/sdk`. Key never exposed to browser.
- **Conversation history**: Stored in a dedicated `ask_ai` Postgres schema. Not synced.
- **No data access**: RAG only — no live settings, logs, or config in this iteration.
- **Access**: All authenticated users.
- **Servers**: Both facility-server and central-server.
- **API keys required**: `ANTHROPIC_API_KEY` (LLM calls) + `VOYAGE_API_KEY` (query embedding for RAG search).

---

## Phase 1: Configuration
*Testable: immediately, with no other phases complete.*

Add to `packages/facility-server/config/default.json5` and `packages/central-server/config/default.json5`:

```json5
askAi: {
  enabled: false,            // Set to true in local.json5
  anthropicApiKey: '',       // Anthropic API key
  voyageApiKey: '',          // Voyage AI API key (for query embedding)
  ragNamespace: 'tamanu',   // Namespace used when indexing with github-repo-rag
}
```

**Checkpoint:** `config.get('askAi.enabled')` returns `false` in tests; set to `true` in `local.json5` and confirm it reads correctly.

---

## Phase 2: GitAgent Definition
*Testable: review only — no runtime dependencies.*

Create version-controlled agent specification files at `ask-ai/agent/`:

**`agent.yaml`** — agent manifest:
```yaml
name: tamanu-ask-ai
version: 1.0.0
description: End-user assistant for Tamanu healthcare management system
model: claude-sonnet-4-6
skills:
  - rag-search
memory: false
```

**`SOUL.md`** — agent identity: friendly, plain-language helper for clinical staff. Cannot access live patient data or system configs.

**`SKILL.md`** — agent capabilities: feature how-tos, error explanations, workflow guidance. Documents what it cannot answer (live data, patient records).

**Checkpoint:** Files exist in repo, reviewed for accuracy. No code to run.

---

## Phase 3: BAML Setup
*Testable: independently, needs only an Anthropic API key.*

BAML manages the LLM interaction contract — prompts and typed response shapes compile to TypeScript.

**Install:** `@boundaryml/baml` in `packages/shared/package.json`. Add `baml-cli generate` step to `packages/shared`'s build script.

**File:** `packages/shared/src/baml/ask-ai.baml`

```baml
client<llm> AnthropicClient {
  provider anthropic
  options {
    model "claude-sonnet-4-6"
    api_key env.ANTHROPIC_API_KEY
  }
}

class RagSource {
  filePath string
  excerpt string
}

class AskAiResponse {
  answer string
  sources RagSource[]
  cannotAnswer bool
}

function AskTamanu(
  userQuestion: string,
  ragContext: string,
  conversationHistory: string
) -> AskAiResponse {
  client AnthropicClient
  prompt #"
    You are a helpful assistant for Tamanu, a healthcare management system.
    Answer questions from clinical staff about how Tamanu works.
    Use only the provided context — do not guess or invent features.
    If the context does not contain enough information to answer, set cannotAnswer to true.

    Context from Tamanu documentation and codebase:
    {{ ragContext }}

    Conversation so far:
    {{ conversationHistory }}

    User question: {{ userQuestion }}

    {{ ctx.output_format }}
  "#
}
```

BAML generates `packages/shared/src/baml/baml_client/` — the TypeScript client used by `AskAiService`.

**Checkpoint:** `baml-cli generate` runs without errors. Generated TypeScript compiles. Write a standalone script that calls `b.AskTamanu("Can I book recurring appointments?", "mock context", "")` with a real Anthropic key and verify a typed `AskAiResponse` comes back.

---

## Phase 4: Database — `rag` + `ask_ai` schemas
*Testable: independently, needs only a local Postgres instance.*

### 4a. Migration: Enable pgvector and create schemas
**File:** `packages/database/src/migrations/{timestamp}-createAskAiSchemas.ts`

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS rag;
CREATE SCHEMA IF NOT EXISTS ask_ai;
```

The `rag` tables are populated by the github-repo-rag sidecar. Tamanu only needs the schema to exist.

### 4b. Migration: Create conversation tables (DDL)
**File:** `packages/database/src/migrations/{timestamp}-createAskAiTables.ts`

```sql
CREATE TABLE ask_ai.conversations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  title text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE ask_ai.messages (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES ask_ai.conversations(id),
  role text NOT NULL,  -- 'user' | 'assistant'
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_ask_ai_conversations_user_id ON ask_ai.conversations(user_id);
CREATE INDEX idx_ask_ai_messages_conversation_id ON ask_ai.messages(conversation_id);
```

No `updated_at_sync_tick` — not sync-eligible.

### 4c. Sequelize models
- `packages/database/src/models/AskAiConversation.ts` — maps to `ask_ai.conversations`
- `packages/database/src/models/AskAiMessage.ts` — maps to `ask_ai.messages`

Both extend `Model`. `syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC`. Use `schema: 'ask_ai'` in `initModel` options. Register in `packages/database/src/models/index.ts`.

**Checkpoint:** Run migrations (`npm run facility-migrate`). Verify `ask_ai.conversations` and `ask_ai.messages` tables exist. Verify `rag` schema exists. Create and query a test conversation record via Sequelize model in a test script.

---

## Phase 5: AskAiService
*Testable: unit tests with mocks (no API keys); integration test with real keys + populated `rag` schema.*

**File:** `packages/shared/src/services/AskAiService.ts`

### 5a. RAG query embedding + search
```typescript
async searchRag(query: string, db: Sequelize, namespace: string, voyageApiKey: string): Promise<{ chunks: string, sources: RagSource[] }>
```

1. POST to Voyage AI REST API to embed the query (`voyage-code-3`, 1024 dimensions)
2. Raw SQL with pgvector cosine distance + full-text search, RRF-ranked, against `rag.{namespace}_code` and `rag.{namespace}_docs`
3. Return top-6 chunks with file paths

Mirrors the pattern in `rag/query.py` from github-repo-rag.

### 5b. Main chat method
```typescript
async chat(params: {
  conversationId: string,
  userMessage: string,
  db: Sequelize,
  models: Models,
  voyageApiKey: string,
  ragNamespace: string,
}): Promise<AskAiResponse>
```

1. Load last 20 messages from `ask_ai.messages`
2. Call `searchRag` with the user's message
3. Call BAML `b.AskTamanu(userMessage, ragContext, conversationHistory)`
4. Persist user + assistant messages to `ask_ai.messages`
5. Return `AskAiResponse`

**Checkpoint (unit):** Mock Voyage API, mock DB queries, mock BAML client. Verify `chat()` persists messages and returns a well-formed `AskAiResponse`. Verify `cannotAnswer: true` is returned when RAG context is empty.

**Checkpoint (integration):** With real API keys and a `rag` schema populated by github-repo-rag, run a script calling `chat()` directly. Verify a meaningful answer to "Can I book recurring appointments?" comes back with sources.

---

## Phase 6: API Routes
*Testable: facility-server integration tests with a test database.*

**File:** `packages/facility-server/app/routes/apiv1/askAi.js`
**Register in:** `packages/facility-server/app/routes/apiv1/index.js`
**Central server:** same routes added to central-server's route builder

```
POST   /api/v1/ask-ai/conversations                  — create conversation
GET    /api/v1/ask-ai/conversations                  — list user's own conversations
GET    /api/v1/ask-ai/conversations/:id              — get conversation + messages
POST   /api/v1/ask-ai/conversations/:id/messages     — send message, get AI response
DELETE /api/v1/ask-ai/conversations/:id              — soft-delete conversation
```

- `req.checkPermission('write', 'AskAiMessage')` on message send
- Users access only their own conversations (`userId = req.user.id`)
- Returns 503 if `askAi.enabled` is false

**Checkpoint:** Integration tests (existing facility-server test harness):
- `POST /ask-ai/conversations` returns 200 + conversation object
- `POST /ask-ai/conversations/:id/messages` returns 200 + assistant response (mock `AskAiService` in tests)
- Unauthenticated request returns 401
- Request with `askAi.enabled = false` returns 503
- User cannot fetch another user's conversation (403)

---

## Phase 7: Frontend — Sidebar Chat Panel
*Testable: manually in browser once Phase 6 is working.*

### 7a. AskAiPanel component
**File:** `packages/web/app/components/Sidebar/AskAiPanel.jsx`

- Collapsible panel with local `isOpen` state
- **Collapsed**: icon + "Ask AI" label (icon-only when sidebar retracted)
- **Expanded**: ~300px scrollable message list + text input; shows file path sources beneath each assistant response; graceful "I don't have enough context" display when `cannotAnswer: true`
- `useApi()` for API calls; lazily creates conversation on first message send
- Styled to `Colors.primaryDark`, white text

### 7b. Sidebar integration
**File:** `packages/web/app/components/Sidebar/Sidebar.jsx`

Insert between `</List>` and `<Footer>`:
```jsx
<AskAiPanel isRetracted={isRetracted} />
```

**Checkpoint:**
1. Panel visible in sidebar above user profile
2. Ask "Can I book recurring appointments?" → receives a plain-language answer with sources
3. Ask the syndromic surveillance error question → answer explains the reporting schema context
4. Conversation history survives page reload
5. `askAi.enabled = false` → panel hidden or shows "Ask AI is not configured"

---

## Critical Files

| File | Phase | Change |
|------|-------|--------|
| `packages/facility-server/config/default.json5` | 1 | Add `askAi` config block |
| `packages/central-server/config/default.json5` | 1 | Add `askAi` config block |
| `ask-ai/agent/agent.yaml` | 2 | New — GitAgent manifest |
| `ask-ai/agent/SOUL.md` | 2 | New — agent identity |
| `ask-ai/agent/SKILL.md` | 2 | New — agent capabilities |
| `packages/shared/src/baml/ask-ai.baml` | 3 | New — BAML prompt + response types |
| `packages/shared/src/baml/baml_client/` | 3 | Generated — BAML TypeScript client |
| `packages/shared/package.json` | 3 | Add `@boundaryml/baml` |
| `packages/database/src/migrations/{ts}-createAskAiSchemas.ts` | 4 | New — pgvector, `rag` + `ask_ai` schemas |
| `packages/database/src/migrations/{ts}-createAskAiTables.ts` | 4 | New — conversation tables |
| `packages/database/src/models/AskAiConversation.ts` | 4 | New model |
| `packages/database/src/models/AskAiMessage.ts` | 4 | New model |
| `packages/database/src/models/index.ts` | 4 | Register new models |
| `packages/shared/src/services/AskAiService.ts` | 5 | New — RAG search + BAML chat |
| `packages/facility-server/app/routes/apiv1/askAi.js` | 6 | New route handlers |
| `packages/facility-server/app/routes/apiv1/index.js` | 6 | Register routes |
| `packages/central-server/app/` (route builder) | 6 | Register routes |
| `packages/web/app/components/Sidebar/AskAiPanel.jsx` | 7 | New — chat UI |
| `packages/web/app/components/Sidebar/Sidebar.jsx` | 7 | Insert AskAiPanel |

---

## Execution approach

- **Pause after each phase** for review before proceeding to the next.

---

## Notes on GitAgent fit

GitAgent is appropriate here: the agent's identity, skills, and rules live in version-controlled files alongside the code. Prompt changes go through code review, the agent's capabilities are auditable, and the definition can be exported to other frameworks if needed. BAML complements this by formalising the prompt-to-response contract in a typed, testable way — the `.baml` file is effectively the agent's "interface contract".

# Tamanu Local Dev Cheat Sheet

## Startup

### 1. Start PostgreSQL
```bash
sudo service postgresql start
```
Verify: `pg_lsclusters` → status should show **online**

### 2. Build shared package
> Required after pulling changes, after modifying BAML files, or if shared code has changed.
```bash
cd ~/projects/tamanu/packages/shared && npm run build
```
This runs `baml-cli generate` first, then compiles TypeScript.

### 3. Start facility server (Terminal 1)
```bash
cd ~/projects/tamanu/packages/facility-server && npm run start-dev
```
Wait for: `Starting facility server version 2.x.x`

### 4. Start web frontend (Terminal 2)
```bash
cd ~/projects/tamanu/packages/web && npm run start-dev
```
Open: **http://localhost:5173**

---

## Ports

| Service          | Port |
|------------------|------|
| PostgreSQL       | 5434 |
| Facility server  | 4000 |
| Central server   | 3000 |
| Web frontend     | 5173 |

---

## Switching backend target

The web frontend proxies to facility server by default. To switch:

```bash
# Facility server (default)
cd ~/projects/tamanu/packages/web && npm run start-dev

# Central server
TAMANU_VITE_TARGET=http://localhost:3000 npm run start-dev
```

---

## Ask AI (Chat feature)

The Chat button (bottom-right FAB) calls the facility server's `/api/ask-ai` endpoints.

### Config (facility-server `config/local.json5`)
```json5
askAi: {
  enabled: true,
  anthropicApiKey: "sk-ant-...",
  voyageApiKey: "pa-...",
  ragNamespace: "tamanu",
  ragDatabaseUrl: "postgres://user:pass@localhost:5434/rag_db",
}
```

### How it works
1. User sends a message → facility server calls `AskAiService.chat()`
2. BAML calls Claude with the `SearchTamanu` tool
3. Claude decides to search RAG (or ask a clarifying question)
4. `SearchTamanu` runs hybrid vector + full-text search via Voyage AI embeddings
5. Claude answers based on retrieved docs; response returned to frontend

### Regenerating BAML client
After editing `packages/shared/src/baml_src/ask-ai.baml`, rebuild shared:
```bash
cd ~/projects/tamanu/packages/shared && npm run build
```
`baml-cli generate` runs automatically as part of the build.

---

## Shutdown

- Stop facility/web: `Ctrl+C` in each terminal
- Stop PostgreSQL: `sudo service postgresql stop`

---

## Common issues

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED 127.0.0.1:5434` | PostgreSQL not running — `sudo service postgresql start` |
| `ECONNREFUSED 127.0.0.1:4000` | Facility server not running — start it first |
| `npm ls` peer dep errors on build | Build shared directly: `cd packages/shared && npm run build` |
| Vite ws proxy errors | Facility server not running yet — wait or start it |
| `ANTHROPIC_API_KEY not set` | Check `askAi.anthropicApiKey` in facility-server config |
| BAML parse errors after editing `.baml` | Run `cd packages/shared && npm run build` to regenerate client |

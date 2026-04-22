# Ask AI — RAG Database Operations

The Ask AI chatbot uses a RAG (Retrieval-Augmented Generation) database to answer questions about Tamanu. This database is a PostgreSQL `rag` schema populated by the [github-repo-rag](https://github.com/beyondessential/github-repo-rag) Python sidecar. Tamanu itself is read-only against this schema.

## Architecture

- **RAG database**: The `rag` schema in Tamanu's existing Postgres instance, tables `rag.tamanu_code` and `rag.tamanu_docs`
- **Indexing tool**: `github-repo-rag` sidecar — checks out Tamanu at a release tag and populates the `rag` schema with pgvector embeddings
- **Namespace**: Always `tamanu` — overwritten on each release, no per-version namespaces
- **Config key**: `askAi.ragNamespace` (default: `tamanu`) and `askAi.ragDatabaseUrl`

## Deployment Sequence

The RAG database must be re-indexed whenever a new Tamanu version is deployed, so the assistant's answers reflect the current version's features and behaviour.

### Steps

1. **Deploy Tamanu** as normal — run migrations, restart servers.
2. **Re-index the RAG database** by running the `github-repo-rag` sidecar against the new release tag (see [Manual Re-index](#manual-re-index) for the command).
3. **Verify** the index completed successfully (see [Verifying an Index Run](#verifying-an-index-run)).

Re-indexing can run before or after the server restarts — Tamanu reads from the `rag` schema on every query, so the content is live as soon as the sidecar finishes. There is no server restart required after re-indexing.

### During the re-index window

While the sidecar is running, the `tamanu` namespace is being overwritten in place. Queries during this window may return a mix of old and new content. This is acceptable — it is a brief transitional state and resolves as soon as indexing completes.

If Ask AI answers seem stale or low-quality after a deployment, check whether the re-index completed successfully before investigating further.

## Normal Operation

Re-indexing is run via the `github-repo-rag` sidecar as part of each release. Check the `github-repo-rag` repo for how this is triggered.

## Prerequisites Before Enabling Ask AI

Before setting `askAi.enabled: true` on any environment:

1. **`askAi.ragDatabaseUrl`** — must point to the PostgreSQL instance where the `rag` schema was populated. This is typically the same instance as the facility/central server database.
2. **`askAi.voyageApiKey`** — Voyage AI API key for query embedding. Obtain from the BES 1Password vault.
3. **`askAi.anthropicApiKey`** — Anthropic API key for the LLM. Obtain from the BES 1Password vault.
4. **Initial index run** — the `github-repo-rag` sidecar must have completed successfully at least once for this environment's `ragDatabaseUrl`. Enabling Ask AI against an empty `rag` schema will result in the assistant returning "I don't have enough context to answer" for every question.

## Manual Re-index

Use this when the RAG content is degraded or you need to re-index a specific version:

```bash
# In the github-repo-rag repo:
python index.py \
  --source-repo beyondessential/tamanu \
  --ref v2.53.0 \
  --namespace tamanu \
  --db-url "postgresql://user:pass@host:5432/dbname"
```

Check the `github-repo-rag` repo's README for the current CLI flags — these may change.

## Rollback

If a new index is degraded (wrong content, corrupt embeddings, model changed without re-indexing), roll back by re-indexing the previous release tag. No Tamanu config changes needed — `ragNamespace` stays `tamanu`.

The re-index overwrites the `tamanu` namespace in place. The previous content is not preserved.

## Verifying an Index Run

After an index completes, verify it is populated:

```sql
SELECT
  (SELECT count(*) FROM rag.tamanu_code) AS code_chunks,
  (SELECT count(*) FROM rag.tamanu_docs) AS doc_chunks;
```

A healthy index typically has several thousand rows in each table. Zero rows means the index either hasn't run or failed silently.

You can also smoke test via the Ask AI panel: ask "Can I book recurring appointments?" — a working index will return a contextual answer with file path sources.

## Disabling Ask AI

Set `askAi.enabled: false` in the server's `local.json5`. The `rag` schema is left in place. The server returns `503` for all `/ask-ai/` routes when disabled.

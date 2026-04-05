import { type QueryInterface } from 'sequelize';

// Creates the rag and ask_ai schemas and enables the pgvector extension.
//
// The rag schema is populated by the github-repo-rag Python sidecar — Tamanu
// only needs the schema to exist so that queries against it don't fail on
// startup when the feature is disabled.
//
// The ask_ai schema holds conversation history for the Ask AI chatbot.

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector');
  await query.createSchema('rag', {});
  await query.createSchema('ask_ai', {});
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropSchema('ask_ai', {});
  await query.dropSchema('rag', {});
  // Intentionally not dropping the vector extension — it may be used by other schemas.
}

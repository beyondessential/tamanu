import { Sequelize } from 'sequelize';
import { b } from '../baml_src/baml_client/index';

const SENSITIVE_KEY_PATTERN = /password|apikey|secret|token|databaseurl|connectionstring/i;

export function sanitiseConfigForAi(value: unknown, depth = 0): unknown {
  if (depth > 10 || value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => sanitiseConfigForAi(item, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = SENSITIVE_KEY_PATTERN.test(k) ? '[REDACTED]' : sanitiseConfigForAi(v, depth + 1);
  }
  return result;
}

const RAG_TOP_K = 10;
const CONVERSATION_HISTORY_LIMIT = 20;

interface RagSource {
  filePath: string;
  excerpt: string;
}

interface SearchRagResult {
  chunks: string;
  sources: RagSource[];
}

interface ChatParams {
  conversationId: string;
  userMessage: string;
  ragDatabaseUrl: string;
  models: Record<string, any>;
  voyageApiKey: string;
  anthropicApiKey: string;
  ragNamespace: string;
  serverConfig?: string;
  appSettings?: string;
}

interface ChatResponse {
  answer: string;
  cannotAnswer: boolean;
  clarifyingQuestion: string;
  sources: RagSource[];
}

// Cache Sequelize connections to the RAG database by URL to avoid reconnecting on every request
const ragDbCache = new Map<string, Sequelize>();

function getRagDb(url: string): Sequelize {
  if (!ragDbCache.has(url)) {
    ragDbCache.set(url, new Sequelize(url, { logging: false }));
  }
  return ragDbCache.get(url)!;
}

async function embedQuery(query: string, voyageApiKey: string): Promise<number[]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${voyageApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [query],
      model: 'voyage-code-3',
      output_dimension: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage AI embedding failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

async function searchRag(
  query: string,
  ragDatabaseUrl: string,
  namespace: string,
  voyageApiKey: string,
): Promise<SearchRagResult> {
  const embedding = await embedQuery(query, voyageApiKey);
  const embeddingLiteral = `'[${embedding.join(',')}]'`;
  const db = getRagDb(ragDatabaseUrl);

  // Hybrid search: vector (cosine) + full-text, RRF-ranked
  const sql = `
    WITH vector_search AS (
      (SELECT file_path, text, 1 - (embedding <=> ${embeddingLiteral}::vector) AS score
      FROM ${namespace}_code
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingLiteral}::vector
      LIMIT ${RAG_TOP_K * 2})
      UNION ALL
      (SELECT file_path, text, 1 - (embedding <=> ${embeddingLiteral}::vector) AS score
      FROM ${namespace}_docs
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingLiteral}::vector
      LIMIT ${RAG_TOP_K * 2})
    ),
    fts_search AS (
      (SELECT file_path, text, ts_rank(to_tsvector('english', text), plainto_tsquery('english', :query)) AS score
      FROM ${namespace}_code
      WHERE to_tsvector('english', text) @@ plainto_tsquery('english', :query)
      LIMIT ${RAG_TOP_K * 2})
      UNION ALL
      (SELECT file_path, text, ts_rank(to_tsvector('english', text), plainto_tsquery('english', :query)) AS score
      FROM ${namespace}_docs
      WHERE to_tsvector('english', text) @@ plainto_tsquery('english', :query)
      LIMIT ${RAG_TOP_K * 2})
    ),
    rrf AS (
      SELECT
        COALESCE(v.file_path, f.file_path) AS file_path,
        COALESCE(v.text, f.text) AS text,
        COALESCE(1.0 / (60 + ROW_NUMBER() OVER (ORDER BY v.score DESC)), 0) +
        COALESCE(1.0 / (60 + ROW_NUMBER() OVER (ORDER BY f.score DESC)), 0) AS rrf_score
      FROM vector_search v
      FULL OUTER JOIN fts_search f ON v.file_path = f.file_path AND v.text = f.text
    )
    SELECT file_path, text
    FROM rrf
    ORDER BY rrf_score DESC
    LIMIT ${RAG_TOP_K};
  `;

  let rows: Array<{ file_path: string; text: string }>;
  try {
    [rows] = (await db.query(sql, { replacements: { query } })) as [
      Array<{ file_path: string; text: string }>,
      unknown,
    ];
  } catch (err: any) {
    // RAG tables not yet indexed — return empty context so the LLM can still answer
    if (err?.message?.includes('does not exist')) {
      return { chunks: '', sources: [] };
    }
    throw err;
  }

  if (rows.length === 0) {
    return { chunks: '', sources: [] };
  }

  const sources: RagSource[] = rows.map(row => ({
    filePath: row.file_path,
    excerpt: row.text.slice(0, 200),
  }));

  const chunks = rows.map(row => `[${row.file_path}]\n${row.text}`).join('\n\n---\n\n');

  return { chunks, sources };
}

export async function chat({
  conversationId,
  userMessage,
  ragDatabaseUrl,
  models,
  voyageApiKey,
  anthropicApiKey,
  ragNamespace,
  serverConfig,
  appSettings,
}: ChatParams): Promise<ChatResponse> {
  // Load recent conversation history
  const recentMessages = await models.AskAiMessage.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
    limit: CONVERSATION_HISTORY_LIMIT,
  });

  const conversationHistory = recentMessages
    .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  // Search RAG before calling the LLM so it has relevant documentation to answer from
  const { chunks, sources: collectedSources } = await searchRag(
    userMessage,
    ragDatabaseUrl,
    ragNamespace,
    voyageApiKey,
  );

  // BAML lazily reads env vars on each call — set the key before invoking
  process.env.ANTHROPIC_API_KEY = anthropicApiKey;

  const response = await b.AskTamanu(
    userMessage,
    conversationHistory,
    serverConfig ?? '',
    appSettings ?? '',
    chunks,
  );

  // Sources from the tamanu codebase namespace are file paths — not meaningful for end users
  const includeSources = collectedSources.length > 0 && ragNamespace !== 'tamanu';

  const result: ChatResponse = {
    answer: response.answer,
    cannotAnswer: response.cannotAnswer,
    clarifyingQuestion: response.clarifyingQuestion,
    sources: includeSources ? collectedSources : [],
  };

  // Persist messages — always save the user message; save assistant response
  // regardless of whether it's an answer or a clarifying question
  const assistantContent = response.clarifyingQuestion || response.answer;
  await models.AskAiMessage.create({
    conversationId,
    role: 'user',
    content: userMessage,
  });
  if (assistantContent) {
    await models.AskAiMessage.create({
      conversationId,
      role: 'assistant',
      content: assistantContent,
    });
  }

  return result;
}

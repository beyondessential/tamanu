import { pick } from 'lodash';
import { Sequelize } from 'sequelize';
import { b } from '../baml_src/baml_client/index';

// Explicit allowlist of config paths safe to share with the LLM.
// Only include paths that are known to be non-sensitive.
// Never add credentials, API keys, secrets, or database connection strings here.
const SAFE_CONFIG_PATHS = [
  // Server identity
  'port',
  'canonicalHostName',
  'deviceId',
  'primaryTimeZone',
  'countryTimeZone',
  'allowMismatchedTimeZones',

  // Logging
  'log.consoleLevel',
  'log.color',
  'log.timeless',

  // Error reporting — enabled flag and type only, not the API key
  'errors.enabled',
  'errors.type',

  // Admin
  'admin.allowAdminRoutes',

  // Authentication — operational settings only, not secrets
  'auth.saltRounds',
  'auth.tokenDuration',
  'auth.useHardcodedPermissions',
  'auth.reportNoUserError',

  // Sync — connectivity and tuning settings, not credentials
  'sync.schedule',
  'sync.host',
  'sync.enabled',
  'sync.timeout',
  'sync.jitterTime',
  'sync.backoff',
  'sync.dynamicLimiter',
  'sync.maxConcurrentSessions',
  'sync.lookupTable',
  'sync.persistedCacheBatchSize',

  // Feature availability
  'askAi.enabled',
  'patientMerge',
  'export',
  'cors',

  // Schedules and infrastructure — cron expressions and batch sizes only
  'schedules',
  'loadshedder',
  'metaServer.hosts',
  'updateUrls',
];

export function sanitiseConfigForAi(config: Record<string, unknown>): Record<string, unknown> {
  return pick(config, SAFE_CONFIG_PATHS);
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
    ragDbCache.set(
      url,
      new Sequelize(url, {
        logging: false,
        pool: {
          max: 2,
          min: 0,
          idle: 30_000,
          acquire: 30_000,
          evict: 60_000,
          // Test the connection before handing it to a caller — discards dead
          // connections that survive after a database restart
          validate: (connection: any) =>
            Boolean(connection && !connection.connection?.stream?.destroyed),
        },
        dialectOptions: {
          // TCP keepalives so the OS detects dead connections without waiting
          // for a query to time out
          keepAlive: true,
        },
      }),
    );
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
  voyageApiKey: string,
): Promise<SearchRagResult> {
  const embedding = await embedQuery(query, voyageApiKey);
  const embeddingLiteral = `'[${embedding.join(',')}]'`;
  const db = getRagDb(ragDatabaseUrl);

  // Hybrid search: vector (cosine) + full-text, RRF-ranked
  const sql = `
    WITH vector_search AS (
      (SELECT file_path, text, 1 - (embedding <=> ${embeddingLiteral}::vector) AS score
      FROM tamanu_code
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingLiteral}::vector
      LIMIT ${RAG_TOP_K * 2})
      UNION ALL
      (SELECT file_path, text, 1 - (embedding <=> ${embeddingLiteral}::vector) AS score
      FROM tamanu_docs
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingLiteral}::vector
      LIMIT ${RAG_TOP_K * 2})
    ),
    fts_search AS (
      (SELECT file_path, text, ts_rank(to_tsvector('english', text), plainto_tsquery('english', :query)) AS score
      FROM tamanu_code
      WHERE to_tsvector('english', text) @@ plainto_tsquery('english', :query)
      LIMIT ${RAG_TOP_K * 2})
      UNION ALL
      (SELECT file_path, text, ts_rank(to_tsvector('english', text), plainto_tsquery('english', :query)) AS score
      FROM tamanu_docs
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
    voyageApiKey,
  );

  const response = await b.AskTamanu(
    userMessage,
    conversationHistory,
    serverConfig ?? '',
    appSettings ?? '',
    chunks,
    { env: { ANTHROPIC_API_KEY: anthropicApiKey } },
  );

  // Sources from the tamanu codebase namespace are file paths — not meaningful for end users
  const result: ChatResponse = {
    answer: response.answer,
    cannotAnswer: response.cannotAnswer,
    clarifyingQuestion: response.clarifyingQuestion,
    sources: [],
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

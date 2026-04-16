import { pick } from 'lodash';
import { Sequelize } from 'sequelize';

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
  provider?: 'anthropic' | 'local';
  localLlm?: { endpoint: string; model: string };
  serverConfig?: string;
  appSettings?: string;
}

interface ChatResponse {
  answer: string;
  cannotAnswer: boolean;
  clarifyingQuestion: string;
  sources: RagSource[];
}

// Cache Sequelize connection pools keyed by RAG database URL.
// Capped at MAX_RAG_DB_CACHE_SIZE: if a new URL arrives when the cache is full
// the oldest entry is closed and evicted first, preventing pool leaks if the URL
// ever rotates or varies per request.
const MAX_RAG_DB_CACHE_SIZE = 10;
const ragDbCache = new Map<string, Sequelize>();

function getRagDb(url: string): Sequelize {
  if (!ragDbCache.has(url)) {
    if (ragDbCache.size >= MAX_RAG_DB_CACHE_SIZE) {
      const oldest = ragDbCache.entries().next().value as [string, Sequelize] | undefined;
      if (oldest) {
        const [oldestUrl, oldestDb] = oldest;
        oldestDb.close().catch(() => {});
        ragDbCache.delete(oldestUrl);
      }
    }
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
  // Pass the vector as a bind parameter ($embedding) so Postgres receives it
  // out-of-band and can cache the query plan. Interpolating 1024 floats inline
  // produces a ~10 KB literal repeated 4 times (~40 KB per request) that must
  // be re-parsed on every call.
  const embeddingVector = `[${embedding.join(',')}]`;
  const db = getRagDb(ragDatabaseUrl);

  // Hybrid search: vector (cosine) + full-text, combined with Reciprocal Rank Fusion.
  //
  // Each source CTE ranks its own results before the join. The final step is a
  // UNION ALL of both ranked sets followed by GROUP BY dedup — this avoids the
  // cross-product blowup that a FULL OUTER JOIN on (file_path, text) would cause
  // when the two sources return different chunks.
  //
  // Note: the FTS clauses use inline to_tsvector. The github-repo-rag sidecar
  // creates a GIN index on to_tsvector('english', text) for each table
  // ({table}_fts_idx), so these WHERE clauses benefit from index scans.
  const sql = `
    WITH vector_ranked AS (
      SELECT file_path, text,
        ROW_NUMBER() OVER (ORDER BY distance) AS rank
      FROM (
        (SELECT file_path, text, embedding <=> $embedding::vector AS distance
         FROM tamanu_code
         WHERE embedding IS NOT NULL
         ORDER BY distance
         LIMIT ${RAG_TOP_K * 2})
        UNION ALL
        (SELECT file_path, text, embedding <=> $embedding::vector AS distance
         FROM tamanu_docs
         WHERE embedding IS NOT NULL
         ORDER BY distance
         LIMIT ${RAG_TOP_K * 2})
      ) v
    ),
    fts_ranked AS (
      SELECT file_path, text,
        ROW_NUMBER() OVER (ORDER BY score DESC) AS rank
      FROM (
        (SELECT file_path, text,
           ts_rank(to_tsvector('english', text), plainto_tsquery('english', $query)) AS score
         FROM tamanu_code
         WHERE to_tsvector('english', text) @@ plainto_tsquery('english', $query)
         LIMIT ${RAG_TOP_K * 2})
        UNION ALL
        (SELECT file_path, text,
           ts_rank(to_tsvector('english', text), plainto_tsquery('english', $query)) AS score
         FROM tamanu_docs
         WHERE to_tsvector('english', text) @@ plainto_tsquery('english', $query)
         LIMIT ${RAG_TOP_K * 2})
      ) f
    ),
    rrf AS (
      SELECT file_path, text, 1.0 / (60 + rank) AS rrf_score FROM vector_ranked
      UNION ALL
      SELECT file_path, text, 1.0 / (60 + rank) AS rrf_score FROM fts_ranked
    )
    SELECT file_path, text
    FROM rrf
    GROUP BY file_path, text
    ORDER BY SUM(rrf_score) DESC
    LIMIT ${RAG_TOP_K};
  `;

  let rows: Array<{ file_path: string; text: string }>;
  try {
    [rows] = (await db.query(sql, { bind: { embedding: embeddingVector, query } })) as [
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

function buildSystemPrompt(serverConfig: string, appSettings: string, ragContext: string): string {
  const parts = [
    `You are the Tamanu Assistant — a helpful, calm, and knowledgeable guide for clinical staff
and administrators using the Tamanu healthcare management system.

Use plain language. Be concise. Clinical staff are busy; get to the point.
Be honest about the limits of your knowledge.

Tamanu has two server types: the facility server (used at individual health facilities)
and the central server (used for system-wide administration and reporting).
If a feature is only available on one server type, say so clearly.`,
  ];

  if (serverConfig) {
    parts.push(`\nThis server's current configuration (credentials removed):\n${serverConfig}`);
  }
  if (appSettings) {
    parts.push(`\nThis server's current application settings:\n${appSettings}`);
  }
  if (ragContext) {
    parts.push(`\nRelevant documentation found:\n${ragContext}`);
  }

  parts.push(`
How to respond:
1. If the question is unclear or ambiguous and you cannot give a useful answer even with the
   documentation above, set clarifyingQuestion to ask what you need, and leave answer empty.
2. Answer based on the documentation provided above.
3. If the documentation does not contain enough information to answer, set cannotAnswer to true.
Do not invent features or workflows not found in the documentation.

If your answer may not fully resolve the issue, or the user appears to need hands-on
support with their system, end your answer with:
"If you need further support, visit https://bes-support.zendesk.com/hc/en-us/"

Respond with a JSON object with exactly these fields:
- answer (string): The answer to the user's question. Empty when cannotAnswer is true or clarifyingQuestion is non-empty.
- cannotAnswer (boolean): True only if the provided documentation contained no useful information to answer the question.
- clarifyingQuestion (string): A question to ask the user when their question is ambiguous or needs more context. Empty string if not needed.`);

  return parts.join('\n');
}

async function chatWithLocalLlm(
  userMessage: string,
  conversationHistory: string,
  chunks: string,
  serverConfig: string,
  appSettings: string,
  endpoint: string,
  model: string,
): Promise<Omit<ChatResponse, 'sources'>> {
  const systemPrompt = buildSystemPrompt(serverConfig, appSettings, chunks);
  const userContent = conversationHistory
    ? `Conversation so far:\n${conversationHistory}\n\nUser question: ${userMessage}`
    : userMessage;

  const response = await fetch(`${endpoint}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama LLM call failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const rawContent = data.choices[0].message.content;

  let parsed: { answer?: string; cannotAnswer?: boolean; clarifyingQuestion?: string };
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    // Model didn't return valid JSON — treat raw text as the answer
    return { answer: rawContent, cannotAnswer: false, clarifyingQuestion: '' };
  }

  return {
    answer: parsed.answer ?? '',
    cannotAnswer: Boolean(parsed.cannotAnswer),
    clarifyingQuestion: parsed.clarifyingQuestion ?? '',
  };
}

export async function chat({
  conversationId,
  userMessage,
  ragDatabaseUrl,
  models,
  voyageApiKey,
  anthropicApiKey,
  provider,
  localLlm,
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

  let llmResponse: { answer: string; cannotAnswer: boolean; clarifyingQuestion: string };
  if (provider === 'local') {
    if (!localLlm) throw new Error('localLlm config is required when provider is "local"');
    llmResponse = await chatWithLocalLlm(
      userMessage,
      conversationHistory,
      chunks,
      serverConfig ?? '',
      appSettings ?? '',
      localLlm.endpoint,
      localLlm.model,
    );
  } else {
    const { b } = await import('../baml_src/baml_client/index');
    llmResponse = await b.AskTamanu(
      userMessage,
      conversationHistory,
      serverConfig ?? '',
      appSettings ?? '',
      chunks,
      { env: { ANTHROPIC_API_KEY: anthropicApiKey } },
    );
  }

  // Sources from the tamanu codebase namespace are file paths — not meaningful for end users
  const result: ChatResponse = {
    answer: llmResponse.answer,
    cannotAnswer: llmResponse.cannotAnswer,
    clarifyingQuestion: llmResponse.clarifyingQuestion,
    sources: collectedSources ?? [],
  };

  // Persist messages — always save the user message; save assistant response
  // regardless of whether it's an answer or a clarifying question
  const assistantContent = llmResponse.clarifyingQuestion || llmResponse.answer;
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

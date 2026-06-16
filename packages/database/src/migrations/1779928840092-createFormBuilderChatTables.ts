import { DataTypes, type QueryInterface } from 'sequelize';

const AI_CHAT_SESSIONS_TABLE = { tableName: 'ai_chat_sessions', schema: 'public' };
const FORM_BUILDER_CHAT_JOBS_TABLE = { tableName: 'form_builder_chat_jobs', schema: 'public' };

export async function up(query: QueryInterface): Promise<void> {
  // Multi-turn AI conversation transcripts. Previously held in a per-process
  // in-memory cache, which meant a sessionId became unusable after a restart or
  // when a request landed on a different process/replica. Persisting them lets
  // any central process resolve a session.
  await query.createTable(AI_CHAT_SESSIONS_TABLE, {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    context_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Ordered list of { role: 'system' | 'human' | 'ai', content } turns.
    messages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Async form-builder chat jobs. Previously an in-memory cache, so a poll that
  // landed on a different process (or after a restart) never found the job and
  // hung until the client timed out. Persisting them makes the result visible to
  // every central process.
  await query.createTable(FORM_BUILDER_CHAT_JOBS_TABLE, {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    result: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    error: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(FORM_BUILDER_CHAT_JOBS_TABLE);
  await query.dropTable(AI_CHAT_SESSIONS_TABLE);
}

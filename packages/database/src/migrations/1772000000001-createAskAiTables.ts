import { DataTypes, type QueryInterface } from 'sequelize';

// Creates conversation history tables for the Ask AI chatbot in the ask_ai schema.
// These tables are not synced between facility and central servers.

const CONVERSATIONS = { tableName: 'conversations', schema: 'ask_ai' };
const MESSAGES = { tableName: 'messages', schema: 'ask_ai' };

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(CONVERSATIONS, {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: { tableName: 'users', schema: 'public' }, key: 'id' },
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable(MESSAGES, {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    conversation_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: CONVERSATIONS, key: 'id' },
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'user | assistant',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await query.addIndex(CONVERSATIONS, ['user_id'], {
    name: 'idx_ask_ai_conversations_user_id',
  });

  await query.addIndex(MESSAGES, ['conversation_id'], {
    name: 'idx_ask_ai_messages_conversation_id',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(MESSAGES, 'idx_ask_ai_messages_conversation_id');
  await query.removeIndex(CONVERSATIONS, 'idx_ask_ai_conversations_user_id');
  await query.dropTable(MESSAGES);
  await query.dropTable(CONVERSATIONS);
}

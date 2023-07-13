import { STRING, DATE, NOW, UUIDV4 } from 'sequelize';

export async function up(query) {
  await query.dropTable('channel_sync_pull_cursors');
}

export async function down(query) {
  await query.createTable('channel_sync_pull_cursors', {
    id: {
      type: STRING,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    updated_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DATE,
      allowNull: true,
    },
    channel: {
      type: STRING,
      allowNull: false,
    },
    pull_cursor: {
      type: STRING,
      allowNull: true,
    },
  });
}

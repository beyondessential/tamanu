import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.dropTable('channel_sync_pull_cursors');
}

export async function down(query: QueryInterface) {
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
      type: Sequelize.STRING,
      allowNull: false,
    },
    pull_cursor: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });
}

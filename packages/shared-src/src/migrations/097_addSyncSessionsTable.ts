import Sequelize, { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('sync_sessions', {
    id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    start_time: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    last_connection_time: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at_sync_index: {
      type: Sequelize.BIGINT,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('sync_sessions');
}

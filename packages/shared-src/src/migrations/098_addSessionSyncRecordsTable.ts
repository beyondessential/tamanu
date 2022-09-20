import Sequelize, { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('session_sync_records', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
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
    session_id: {
      type: Sequelize.UUID,
      references: {
        model: 'sync_sessions',
        key: 'id',
      },
      allowNull: false,
    },
    direction: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    record_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    record_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    is_deleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    data: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    updated_at_sync_tick: {
      type: Sequelize.BIGINT,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('session_sync_records');
}

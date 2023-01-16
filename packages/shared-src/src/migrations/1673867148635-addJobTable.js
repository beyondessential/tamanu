import Sequelize, { DataTypes } from 'sequelize';

const TABLE_NAME = 'jobs';

export async function up(query) {
  await query.createTable(TABLE_NAME, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },

    // queue-related fields
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Queued',
      allowNull: false,
    },
    worker_id: DataTypes.UUID,
    started_at: DataTypes.DATE,
    completed_at: DataTypes.DATE,
    errored_at: DataTypes.DATE,
    error: DataTypes.TEXT,

    // data fields
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payload: DataTypes.JSONB,
  });

  await query.addIndex(TABLE_NAME, ['topic']);
  await query.addIndex(TABLE_NAME, ['status']);
  await query.addIndex(TABLE_NAME, ['priority']);
  await query.addIndex(TABLE_NAME, ['topic', 'status', 'priority']);
}

export async function down(query) {
  await query.dropTable(TABLE_NAME);
}

import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.dropTable('sync_session_records');
}

export async function down(query) {
  await query.createTable('sync_session_records', {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_id: {
      type: DataTypes.UUID,
      references: {
        model: 'sync_sessions',
        key: 'id',
      },
      allowNull: false,
    },
    direction: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    record_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    record_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    saved_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    updated_at_by_field_sum: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  });
  await query.sequelize.query(`
    CREATE INDEX sync_session_record_session_id_direction_index ON sync_session_records(session_id, direction);
  `);
}

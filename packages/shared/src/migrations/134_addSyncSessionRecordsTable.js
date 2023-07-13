import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('sync_session_records', {
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
  });
}

export async function down(query) {
  await query.dropTable('sync_session_records');
}

import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('sync_sessions', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
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
      defaultValue: Sequelize.NOW,
    },
    last_connection_time: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updated_at_sync_tick: {
      type: Sequelize.BIGINT,
    },
  });
  await query.sequelize.query(`
    CREATE TRIGGER set_sync_sessions_updated_at_sync_tick
    BEFORE INSERT OR UPDATE ON sync_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_sync_tick();
  `);
}

export async function down(query) {
  await query.dropTable('sync_sessions');
}

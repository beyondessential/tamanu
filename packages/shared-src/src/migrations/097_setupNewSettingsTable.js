import Sequelize from 'sequelize';

const COMMON_COLUMNS = {
  id: {
    type: Sequelize.STRING,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  deleted_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at_sync_tick: {
    type: Sequelize.BIGINT,
  },
};

module.exports = {
  up: async query => {
    await query.dropTable('settings');
    await query.createTable('settings', {
      ...COMMON_COLUMNS,
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      value: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      facility_id: {
        type: Sequelize.STRING,
        references: {
          model: 'facilities',
          key: 'id',
        },
        allowNull: true,
      },
    });
    await query.sequelize.query(`
      CREATE TRIGGER set_settings_updated_at_sync_tick_on_insert
      BEFORE INSERT ON settings
      FOR EACH ROW
      WHEN (NEW.updated_at_sync_tick IS NULL) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_at_sync_tick();
    `);
    await query.sequelize.query(`
      CREATE TRIGGER set_settings_updated_at_sync_tick_on_update
      BEFORE UPDATE ON settings
      FOR EACH ROW
      WHEN (NEW.updated_at_sync_tick IS NULL OR NEW.updated_at_sync_tick = OLD.updated_at_sync_tick) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_at_sync_tick();
    `);
  },
  down: async query => {
    await query.dropTable('settings');
    await query.createTable('settings', {
      ...COMMON_COLUMNS,
      settingName: {
        type: Sequelize.STRING,
        unique: true,
      },
      settingContent: Sequelize.STRING,
    });
    await query.sequelize.query(`
      CREATE TRIGGER set_settings_updated_at_sync_tick_on_insert
      BEFORE INSERT ON settings
      FOR EACH ROW
      WHEN (NEW.updated_at_sync_tick IS NULL) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_at_sync_tick();
    `);
    await query.sequelize.query(`
      CREATE TRIGGER set_settings_updated_at_sync_tick_on_update
      BEFORE UPDATE ON settings
      FOR EACH ROW
      WHEN (NEW.updated_at_sync_tick IS NULL OR NEW.updated_at_sync_tick = OLD.updated_at_sync_tick) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_at_sync_tick();
    `);
  },
};

import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('devices', {
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    public_key: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    registered_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: Sequelize.fn('uuid_nil'),
      references: {
        model: 'users',
        key: 'id',
      },
    },
    last_login_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: Sequelize.fn('uuid_nil'),
      references: {
        model: 'users',
        key: 'id',
      },
    },
    can_login: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    can_sync: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    can_rebind: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  });

  await query.sequelize.query(`
    INSERT INTO devices (id, created_at, updated_at, can_login, can_sync, can_rebind, metadata)
    SELECT
      id,
      created_at,
      updated_at,
      true AS can_login,
      true AS can_sync,
      true AS can_rebind,
      json_build_object('lastSyncTick', last_synced_tick) AS metadata
    FROM sync_queued_devices
  `);

  await query.sequelize.query(`
    INSERT INTO devices (id, can_login, can_sync, can_rebind, metadata)
    SELECT
      device_id AS id,
      true AS can_login,
      true AS can_sync,
      true AS can_rebind,
      json_build_object('lastSyncTick', max(persisted_at_sync_tick)) AS metadata
    FROM sync_device_ticks
    GROUP BY device_id
    ON CONFLICT (id) DO NOTHING
  `);

  await query.addConstraint('sync_device_ticks', {
    name: 'sync_device_ticks_device_id_fkey',
    type: 'foreign key',
    fields: ['device_id'],
    references: {
      table: 'devices',
      field: 'id',
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  await query.addConstraint('sync_queued_devices', {
    name: 'sync_device_ticks_id_fkey',
    type: 'foreign key',
    fields: ['id'],
    references: {
      table: 'devices',
      field: 'id',
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeConstraint('sync_queued_devices', 'sync_device_ticks_id_fkey');
  await query.removeConstraint('sync_device_ticks', 'sync_device_ticks_device_id_fkey');
  await query.dropTable('devices');
}

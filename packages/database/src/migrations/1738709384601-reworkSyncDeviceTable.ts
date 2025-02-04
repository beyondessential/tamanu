import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // make sure all devices have a device_id
  await query.sequelize.query(
    'UPDATE sync_device_ticks SET device_id = id::text WHERE device_id IS NULL',
  );

  await query.renameTable('sync_device_ticks', 'sync_devices');
  await query.addColumn('sync_devices', 'registered_by_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  // generate a new ID column from the device_id field
  await query.addColumn('sync_devices', 'new_id', {
    type: DataTypes.BLOB,
    allowNull: true,
  });
  await query.sequelize.query('UPDATE sync_devices SET new_id = device_id::bytea');
  await query.removeColumn('sync_devices', 'id');
  await query.changeColumn('sync_devices', 'new_id', {
    type: DataTypes.BLOB,
    allowNull: false,
    primaryKey: true,
  });
  await query.renameColumn('sync_devices', 'new_id', 'id');
  await query.removeColumn('sync_devices', 'device_id');
  await query.sequelize.query('ALTER TABLE sync_devices ADD PRIMARY KEY (id)');

  // clean up name of sync tick index
  await query.removeIndex('sync_devices', 'sync_device_ticks_persisted_at_sync_tick');
  await query.addIndex('sync_devices', ['persisted_at_sync_tick']);

  // set existing entries registered by the system user
  await query.sequelize.query(
    'UPDATE sync_devices SET registered_by_id = uuid_nil() WHERE registered_by_id IS NULL',
  );
  await query.changeColumn('sync_devices', 'registered_by_id', {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // restore the device_id field
  await query.addColumn('sync_devices', 'device_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.sequelize.query(`UPDATE sync_devices SET device_id = convert_from(id, 'utf-8')`);

  // restore the old ID column
  await query.addColumn('sync_devices', 'new_id', {
    type: `BIGINT GENERATED ALWAYS AS ("persisted_at_sync_tick") STORED`,
    primaryKey: true,
  });
  await query.removeConstraint('sync_devices', 'sync_devices_pkey');
  await query.removeColumn('sync_devices', 'id');
  await query.renameColumn('sync_devices', 'new_id', 'id');
  await query.sequelize.query('ALTER TABLE sync_devices ADD PRIMARY KEY (id)');

  await query.removeColumn('sync_devices', 'registered_by_id');
  await query.renameTable('sync_devices', 'sync_device_ticks');

  // restore name of sync tick index
  await query.removeIndex('sync_device_ticks', 'sync_devices_persisted_at_sync_tick');
  await query.addIndex('sync_device_ticks', ['persisted_at_sync_tick']);
}

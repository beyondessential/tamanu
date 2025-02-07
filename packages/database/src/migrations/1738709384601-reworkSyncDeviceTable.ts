import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // make sure all rows have a device_id
  await query.sequelize.query(
    'UPDATE sync_device_ticks SET device_id = id::text WHERE device_id IS NULL',
  );

  // delete rows that have duplicate device_id, keeping the one with the highest persisted_at_sync_tick
  await query.sequelize.query(`
    DELETE FROM sync_device_ticks
    WHERE id IN (
      SELECT id
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY persisted_at_sync_tick DESC) AS r
        FROM sync_device_ticks
      ) x
      WHERE x.r > 1
    )
  `);

  await query.createTable('sync_devices', {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    last_persisted_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    registered_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  });

  await query.addIndex('sync_devices', ['last_persisted_at_sync_tick']);

  await query.sequelize.query(`
    INSERT INTO sync_devices (id, last_persisted_at_sync_tick, registered_by_id)
    SELECT device_id, max(persisted_at_sync_tick), uuid_nil()
    FROM sync_device_ticks
    GROUP BY device_id
  `);

  await query.dropTable('sync_device_ticks');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.createTable('sync_device_ticks', {
    id: {
      type: `BIGINT GENERATED ALWAYS AS ("persisted_at_sync_tick") STORED`,
    },
    persisted_at_sync_tick: {
      primaryKey: true,
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  await query.addIndex('sync_device_ticks', {
    fields: ['persisted_at_sync_tick'],
  });

  await query.sequelize.query(`
    INSERT INTO sync_device_ticks (persisted_at_sync_tick, device_id)
    SELECT last_persisted_at_sync_tick, id
    FROM sync_devices
  `);

  await query.dropTable('sync_devices');
}

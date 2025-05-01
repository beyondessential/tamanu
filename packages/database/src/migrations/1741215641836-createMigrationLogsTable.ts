import { FACT_CURRENT_SYNC_TICK, FACT_CURRENT_VERSION, FACT_DEVICE_ID } from '@tamanu/constants';
import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE = { schema: 'logs', tableName: 'migrations' };

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    logged_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('adjusted_timestamp'),
    },
    record_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: Sequelize.fn('cast', Sequelize.fn('local_system_fact', FACT_CURRENT_SYNC_TICK, '0'), 'bigint'),
    },
    device_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: Sequelize.fn('local_system_fact', FACT_DEVICE_ID, 'unknown'),
    },
    version: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: Sequelize.fn('local_system_fact', FACT_CURRENT_VERSION, 'unknown'),
    },
    direction: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    migrations: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  });

  await query.addIndex(TABLE, ['logged_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['record_sync_tick'], { using: 'btree' });
  await query.addIndex(TABLE, ['version'], { using: 'btree' });

  await query.addIndex(TABLE, ['device_id'], { using: 'hash' });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
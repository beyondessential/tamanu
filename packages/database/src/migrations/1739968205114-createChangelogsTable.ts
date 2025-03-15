import { FACT_DEVICE_ID, FACT_CURRENT_VERSION } from '@tamanu/constants';
import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE = { schema: 'logs', tableName: 'changes' };

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
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: Sequelize.fn('local_system_fact', FACT_DEVICE_ID, 'unknown'),
    },
    version: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: Sequelize.fn('local_system_fact', FACT_CURRENT_VERSION, 'unknown'),
    },
    table_oid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    table_schema: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    table_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: { schema: 'public', tableName: 'users' },
        key: 'id',
      },
    },
    record_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    record_update: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    record_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    record_data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  });

  await query.addIndex(TABLE, ['device_id'], { using: 'hash' });
  await query.addIndex(TABLE, ['table_oid'], { using: 'hash' });
  await query.addIndex(TABLE, ['author_id'], { using: 'hash' });
  await query.addIndex(TABLE, ['record_id'], { using: 'hash' });

  await query.addIndex(TABLE, ['logged_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['version'], { using: 'btree' });
  await query.addIndex(TABLE, ['created_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['updated_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['deleted_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['record_sync_tick'], { using: 'btree' });

  await query.addIndex(TABLE, ['record_data'], { using: 'gin' });

  await query.sequelize.query(
    `CREATE INDEX changes_table_full_name ON logs.changes USING HASH ((table_schema || '.' || table_name))`,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}

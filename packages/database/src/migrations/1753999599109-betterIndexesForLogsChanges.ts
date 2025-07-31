import { QueryInterface } from 'sequelize';

const TABLE = { schema: 'logs', tableName: 'changes' };

export async function up(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, 'changes_device_id');
  await query.removeIndex(TABLE, 'changes_logged_at');
  await query.removeIndex(TABLE, 'changes_record_created_at');
  await query.removeIndex(TABLE, 'changes_record_updated_at');
  await query.removeIndex(TABLE, 'changes_table_name');
  await query.removeIndex(TABLE, 'changes_table_oid');
  await query.removeIndex(TABLE, 'changes_updated_by_user_id');

  // btree for regular columns
  await query.addIndex(TABLE, ['device_id']);
  await query.addIndex(TABLE, ['table_oid']);
  await query.addIndex(TABLE, ['updated_by_user_id']);
  await query.sequelize.query(
    `CREATE INDEX changes_table_name ON logs.changes USING btree (((table_schema || '.'::text) || table_name));`,
  );

  // brin for time series
  await query.addIndex(TABLE, ['logged_at'], { using: 'BRIN' });
  await query.addIndex(TABLE, ['record_created_at'], { using: 'BRIN' });
  await query.addIndex(TABLE, ['record_updated_at'], { using: 'BRIN' });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, 'changes_device_id');
  await query.removeIndex(TABLE, 'changes_logged_at');
  await query.removeIndex(TABLE, 'changes_record_created_at');
  await query.removeIndex(TABLE, 'changes_record_updated_at');
  await query.removeIndex(TABLE, 'changes_table_name');
  await query.removeIndex(TABLE, 'changes_table_oid');
  await query.removeIndex(TABLE, 'changes_updated_by_user_id');

  await query.addIndex(TABLE, ['device_id'], { using: 'HASH' });
  await query.addIndex(TABLE, ['table_oid'], { using: 'HASH' });
  await query.addIndex(TABLE, ['updated_by_user_id'], { using: 'HASH' });
  await query.sequelize.query(
    `CREATE INDEX changes_table_name ON logs.changes USING hash (((table_schema || '.'::text) || table_name));`,
  );

  await query.addIndex(TABLE, ['logged_at'], { using: 'BTREE' });
  await query.addIndex(TABLE, ['record_created_at'], { using: 'BTREE' });
  await query.addIndex(TABLE, ['record_updated_at'], { using: 'BTREE' });
}

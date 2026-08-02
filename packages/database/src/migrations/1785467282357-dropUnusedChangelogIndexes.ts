import { QueryInterface } from 'sequelize';

// None of these records a scan on either server type. The changelog's readers filter by record
// id, sync tick or user, and a jsonb_ops GIN index cannot serve the `->>` extraction they use.
const UNUSED_INDEXES = [
  { name: 'changes_record_data', using: 'gin (record_data)' },
  { name: 'changes_record_deleted_at', using: 'btree (record_deleted_at)' },
  { name: 'changes_device_id', using: 'btree (device_id)' },
  { name: 'changes_table_name', using: "btree ((((table_schema || '.'::text) || table_name)))" },
  { name: 'changes_version', using: 'btree (version)' },
  { name: 'changes_table_oid', using: 'btree (table_oid)' },
];

export async function up(query: QueryInterface): Promise<void> {
  for (const { name } of UNUSED_INDEXES) {
    await query.sequelize.query(`DROP INDEX IF EXISTS logs."${name}";`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const { name, using } of UNUSED_INDEXES) {
    await query.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${name}" ON logs.changes USING ${using};`,
    );
  }
}

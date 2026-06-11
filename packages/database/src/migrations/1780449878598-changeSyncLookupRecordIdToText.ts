import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // VARCHAR(255) -> TEXT is binary-coercible in Postgres, so this is a metadata-only
  // change with no table rewrite and no need to revalidate the (record_id, record_type)
  // unique constraint or the indexes that include record_id.
  await query.sequelize.query(`
    ALTER TABLE sync_lookup ALTER COLUMN record_id TYPE TEXT;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE sync_lookup ALTER COLUMN record_id TYPE VARCHAR(255);
  `);
}

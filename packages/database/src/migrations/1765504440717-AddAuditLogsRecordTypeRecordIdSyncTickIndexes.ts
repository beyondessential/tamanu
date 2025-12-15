import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS logs.changes_record_id;

    CREATE INDEX changes_record_id_record_type
    ON logs.changes(table_name, record_id);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS logs.changes_record_id_record_type;

    CREATE INDEX changes_record_id 
    ON logs.changes 
    USING hash (record_id);
  `);
}

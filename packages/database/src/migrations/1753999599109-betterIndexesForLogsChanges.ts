import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Drop existing indexes if they exist
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_device_id;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_logged_at;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_record_created_at;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_record_updated_at;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_table_name;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_table_oid;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_updated_by_user_id;`);

  // Create btree indexes for regular columns
  await query.sequelize.query(
    `CREATE INDEX changes_device_id ON logs.changes USING btree (device_id);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_table_oid ON logs.changes USING btree (table_oid);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_updated_by_user_id ON logs.changes USING btree (updated_by_user_id);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_table_name ON logs.changes USING btree (((table_schema || '.'::text) || table_name));`,
  );

  // Create brin indexes for time series
  await query.sequelize.query(
    `CREATE INDEX changes_logged_at ON logs.changes USING brin (logged_at);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_record_created_at ON logs.changes USING brin (record_created_at);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_record_updated_at ON logs.changes USING brin (record_updated_at);`,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  // Drop existing indexes if they exist
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_device_id;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_logged_at;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_record_created_at;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_record_updated_at;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_table_name;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_table_oid;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS logs.changes_updated_by_user_id;`);

  // Recreate original hash indexes for regular columns
  await query.sequelize.query(
    `CREATE INDEX changes_device_id ON logs.changes USING hash (device_id);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_table_oid ON logs.changes USING hash (table_oid);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_updated_by_user_id ON logs.changes USING hash (updated_by_user_id);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_table_name ON logs.changes USING hash (((table_schema || '.'::text) || table_name));`,
  );

  // Recreate original btree indexes for time series
  await query.sequelize.query(
    `CREATE INDEX changes_logged_at ON logs.changes USING btree (logged_at);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_record_created_at ON logs.changes USING btree (record_created_at);`,
  );
  await query.sequelize.query(
    `CREATE INDEX changes_record_updated_at ON logs.changes USING btree (record_updated_at);`,
  );
}

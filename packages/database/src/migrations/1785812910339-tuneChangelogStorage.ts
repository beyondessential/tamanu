import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // lz4 is a postgres compile-time option; a build without it must not fail the upgrade.
  await query.sequelize.query(`
    DO $$
    BEGIN
      ALTER TABLE logs.changes ALTER COLUMN record_data SET COMPRESSION lz4;
    EXCEPTION
      WHEN feature_not_supported OR undefined_object THEN
        RAISE NOTICE 'lz4 not available, record_data stays on default compression';
    END
    $$;
  `);

  // Default analyze thresholds almost never fire on a table this large, and stale
  // stats push the changelog readers off their indexes.
  await query.sequelize.query(`
    ALTER TABLE logs.changes SET (
      autovacuum_analyze_scale_factor = 0,
      autovacuum_analyze_threshold = 500000
    );
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE logs.changes ALTER COLUMN record_data SET COMPRESSION pglz;
  `);

  await query.sequelize.query(`
    ALTER TABLE logs.changes RESET (
      autovacuum_analyze_scale_factor,
      autovacuum_analyze_threshold
    );
  `);
}

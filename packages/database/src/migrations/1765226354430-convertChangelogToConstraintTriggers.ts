import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Retrieves all tables with changelog triggers that are not constraint triggers
 * To identify a non-constraint trigger, we check the tgconstraint column.
 * A non-constraint trigger has tgconstraint = 0;
 * a constraint trigger will have tgconstraint as an OID.
 */
const getNonConstraintChangelogTriggers = (query: QueryInterface) =>
  query.sequelize.query<{ schema: string; table: string }>(
    `
      SELECT 
        n.nspname AS schema,
        c.relname AS table
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE t.tgname LIKE 'record_%_changelog'
        AND NOT t.tgisinternal
        AND t.tgconstraint = 0
      ORDER BY n.nspname, c.relname
    `,
    { type: QueryTypes.SELECT },
  );

const getConstraintChangelogTriggers = (query: QueryInterface) =>
  query.sequelize.query<{ schema: string; table: string }>(
    `
      SELECT 
        n.nspname AS schema,
        c.relname AS table
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE t.tgname LIKE 'record_%_changelog'
        AND NOT t.tgisinternal
        AND t.tgconstraint <> 0
      ORDER BY n.nspname, c.relname
    `,
    { type: QueryTypes.SELECT },
  );

export async function up(query: QueryInterface): Promise<void> {
  const tables = await getNonConstraintChangelogTriggers(query);
  if (!tables.length) return;

  for (const { schema, table } of tables) {
    await query.sequelize.query(`DROP TRIGGER record_${table}_changelog ON "${schema}"."${table}"`);
    await query.sequelize.query(`
      CREATE CONSTRAINT TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${schema}"."${table}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
  }
}

export async function down(): Promise<void> {
  const tables = await getConstraintChangelogTriggers(query);
  if (!tables.length) return;

  for (const { schema, table } of tables) {
    await query.sequelize.query(`DROP TRIGGER record_${table}_changelog ON "${schema}"."${table}"`);
    await query.sequelize.query(`
      CREATE TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
  }
}

import { QueryInterface, QueryTypes } from 'sequelize';

const getChangelogTriggerTables = (query: QueryInterface) => {
  return query.sequelize.query<{ schema: string; table: string }>(
    `
    SELECT 
      n.nspname as schema,
      c.relname as table
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname LIKE 'record_%_changelog'
    AND NOT t.tgisinternal
    ORDER BY n.nspname, c.relname
    `,
    { type: QueryTypes.SELECT },
  );
};

export async function up(query: QueryInterface): Promise<void> {
  const tables = await getChangelogTriggerTables(query);

  for (const { schema, table } of tables) {
    console.log(`Converting trigger record_${table}_changelog to constraint trigger`);

    await query.sequelize.query(
      `DROP TRIGGER IF EXISTS record_${table}_changelog ON "${schema}"."${table}"`,
    );

    await query.sequelize.query(`
      CREATE CONSTRAINT TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${schema}"."${table}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  const tables = await getChangelogTriggerTables(query);

  for (const { schema, table } of tables) {
    console.log(`Reverting constraint trigger record_${table}_changelog to standard trigger`);

    await query.sequelize.query(
      `DROP TRIGGER IF EXISTS record_${table}_changelog ON "${schema}"."${table}"`,
    );

    await query.sequelize.query(`
      CREATE TRIGGER record_${table}_changelog
      AFTER INSERT OR UPDATE ON "${schema}"."${table}"
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
  }
}

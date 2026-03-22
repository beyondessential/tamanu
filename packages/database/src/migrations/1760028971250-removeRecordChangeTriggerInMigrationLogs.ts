import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS record_migrations_changelog ON logs.migrations;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE TRIGGER record_migrations_changelog
    AFTER INSERT OR UPDATE ON logs.migrations
    FOR EACH ROW
    EXECUTE FUNCTION logs.record_change();
  `);
}

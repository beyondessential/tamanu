import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS record_portal_one_time_tokens_changelog ON portal_one_time_tokens;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE CONSTRAINT TRIGGER record_portal_one_time_tokens_changelog
    AFTER INSERT OR UPDATE ON portal_one_time_tokens
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION logs.record_change();
  `);
}

import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Idempotent: re-applying the same deferrability is a harmless no-op if already deferred.
  await query.sequelize.query(`
    ALTER TABLE logs.changes
    ALTER CONSTRAINT changes_updated_by_user_id_fkey DEFERRABLE INITIALLY DEFERRED;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE logs.changes
    ALTER CONSTRAINT changes_updated_by_user_id_fkey NOT DEFERRABLE;
  `);
}

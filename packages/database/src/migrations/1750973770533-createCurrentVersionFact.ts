import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    INSERT INTO local_system_facts("created_at", "updated_at", "deleted_at", "key", "value")
    VALUES (now(), now(), NULL, 'currentVersion', '2.33')
    ON CONFLICT (key) DO UPDATE SET value = '2.33'
  `);
}

export async function down(_query: QueryInterface): Promise<void> {
  // Do nothing
}

import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE portal_users DROP CONSTRAINT portal_users_email_key;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Fails once patients share an email; those rows must be resolved by hand first.
  await query.sequelize.query(`
    ALTER TABLE portal_users
      ADD CONSTRAINT portal_users_email_key UNIQUE (email)
        DEFERRABLE INITIALLY IMMEDIATE;
  `);
}

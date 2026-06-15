import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // user_login_attempts is PUSH_TO_CENTRAL: rows are recorded on the facility and pushed up.
  // The hard FK to users breaks the whole sync session when the referenced user is missing on
  // the receiving side (e.g. not yet synced, or removed). Drop the constraint, keep an index.
  await query.sequelize.query(`
    ALTER TABLE user_login_attempts
    DROP CONSTRAINT IF EXISTS user_login_attempts_user_id_fkey;
  `);
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS user_login_attempts_user_id ON user_login_attempts (user_id);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('user_login_attempts', ['user_id']);
  // DESTRUCTIVE: removes any login attempts whose user is missing so the constraint can be re-added.
  await query.sequelize.query(`
    DELETE FROM user_login_attempts
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.id = user_login_attempts.user_id);
  `);
  await query.addConstraint('user_login_attempts', {
    fields: ['user_id'],
    type: 'foreign key',
    name: 'user_login_attempts_user_id_fkey',
    references: {
      table: 'users',
      field: 'id',
    },
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

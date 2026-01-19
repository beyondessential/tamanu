import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE user_login_attempts
    DROP CONSTRAINT IF EXISTS user_login_attempts_device_id_fkey;
  `);
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS user_login_attempts_device_id ON user_login_attempts (device_id);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('user_login_attempts', ['device_id']);
  await query.addConstraint('user_login_attempts', {
    fields: ['device_id'],
    type: 'foreign key',
    name: 'user_login_attempts_device_id_fkey',
    references: {
      table: 'devices',
      field: 'id',
    },
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

import { QueryTypes } from 'sequelize';

export async function up(query) {
  const counts = await query.sequelize.query('SELECT COUNT(*) as userCount FROM "users"', {
    type: QueryTypes.SELECT,
  });

  // if there are no users, provisioning will take care of it
  // if there are users, this is an existing install, so create a system user
  if (counts[0].userCount > 0) {
    await query.sequelize.query(`
      INSERT INTO "users"
      (id, email, created_at, updated_at, display_name, role)
      VALUES
      (uuid_nil(), 'system', NOW(), NOW(), 'System', 'admin')
      ON CONFLICT (id) DO NOTHING;
    `);
  }
}

export async function down() {
  // the up migration is idempotent and we also cannot know whether there
  // existed a system user before, so we can't safely revert anything
}

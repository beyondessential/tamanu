import type { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  // The previous iteration of that migration, 1685403132663-systemUser, was too
  // clever and created situations where the system user isn't present in real
  // deployments and also in tests. As we're increasingly relying on the system
  // user existing with a Nil UUID, this migration is here to make certain.
  await query.sequelize.query(`
    INSERT INTO "users"
    (id, email, display_name, role)
    VALUES
    (uuid_nil(), 'system', 'System', 'system')
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function down() {
  // the up migration is idempotent and we also cannot know whether there
  // existed a system user before, so we can't safely revert anything
}

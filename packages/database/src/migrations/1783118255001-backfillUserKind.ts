import { QueryInterface } from 'sequelize';

// addUserKind added the column with default 'user', which mislabels the two
// non-human accounts that predate it: the baseline system user and any sync
// users provisioned before the column existed. Backfill their real kinds so the
// human-users-only filters (which match kind = 'user') exclude them.
// Split from the DDL migration so the column add and this data change run in
// separate transactions (no DDL+DML mixing).
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE users SET kind = 'system'
    WHERE id = '00000000-0000-0000-0000-000000000000';
  `);
  // Dedicated per-device sync accounts use a deterministic email (see
  // syncCredentials.syncUserEmail); provisioned ones are already stamped at
  // creation, so this only catches pre-column rows.
  await query.sequelize.query(`
    UPDATE users SET kind = 'sync'
    WHERE email LIKE 'sync.%@sync.tamanu' AND kind = 'user';
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the original per-row kinds aren't recoverable; revert to 'user'.
  await query.sequelize.query(`
    UPDATE users SET kind = 'user' WHERE kind IN ('system', 'sync');
  `);
}

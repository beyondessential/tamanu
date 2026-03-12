import { QueryInterface } from 'sequelize';

async function findDuplicateDisplayNames(query: QueryInterface) {
  const [duplicates] = await query.sequelize.query(`
    SELECT LOWER(display_name) AS normalized, array_agg(id) AS ids, array_agg(display_name) AS names
    FROM users
    GROUP BY LOWER(display_name)
    HAVING COUNT(*) > 1
  `);
  return duplicates as { normalized: string; ids: string[]; names: string[] }[];
}

export async function up(query: QueryInterface): Promise<void> {
  const duplicates = await findDuplicateDisplayNames(query);
  if (duplicates.length > 0) {
    const details = duplicates
      .map(d => `  "${d.names.join('", "')}" (ids: ${d.ids.join(', ')})`)
      .join('\n');
    throw new Error(
      `Cannot create unique index on users.display_name — duplicate display names found:\n${details}\n\n` +
        'Resolve by renaming or merging the duplicate users in the admin panel, then re-run migrations.',
    );
  }

  await query.sequelize.query(`
    CREATE UNIQUE INDEX users_display_name_unique ON users (LOWER(display_name))
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS users_display_name_unique
  `);
}

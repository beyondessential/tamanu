import { QueryInterface } from 'sequelize';

// Removing the lab result widget left its two whitelist settings with no schema entry and no
// reader. They were central-scoped, so they never left the central server or entered the sync
// lookup table, and deleting them needs no lookup rebuild.
export async function up(query: QueryInterface): Promise<void> {
  // BACKWARD INCOMPATIBLE: earlier releases still serve the widget and, without these rows, answer
  // from their default whitelists instead of the ones the deployment had set
  await query.sequelize.query(`
    DELETE FROM settings
    WHERE scope = 'central'
      AND key LIKE 'labResultWidget.%'
  `);
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: the whitelists a deployment had set are not recoverable. They are unreadable
  // without the schema entries the widget removal took out, so restoring the rows would restore
  // nothing that works.
}

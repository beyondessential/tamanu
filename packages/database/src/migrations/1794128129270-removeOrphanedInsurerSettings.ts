import { QueryInterface } from 'sequelize';

// DML only — the insurer_id drop is its own DDL migration, and mixing the two leaves the audit
// trigger with pending events that the schema change then fails on.
//
// Removing the patient insurer left two setting keys with no schema entry and no reader:
// `insurer.defaultContribution`, which the baseline seeds into every deployment, and whatever a
// deployment configured under the `fields.insurerId` patient field. Neither does any harm where it
// stays — nothing reads them and the admin panel only lists what the schema declares — but they
// are dead rows, so the removal takes them with it.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM settings
    WHERE key = 'insurer.defaultContribution'
       OR key LIKE 'fields.insurerId.%'
  `);
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: whether a deployment had tuned either setting is not recoverable. Both are
  // unreadable without the schema entries the insurer removal took out, so restoring the rows
  // would restore nothing that works.
}

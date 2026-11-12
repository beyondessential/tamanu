import { QueryInterface } from 'sequelize';

// Left over from the encounter_medications rename; firing twice re-stamps pulled rows so facilities push them back.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    'DROP TRIGGER IF EXISTS set_encounter_medications_updated_at_sync_tick ON prescriptions;',
  );
}

export async function down(): Promise<void> {
  // Not recreated: the duplicate trigger is the bug.
}

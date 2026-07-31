import { QueryInterface } from 'sequelize';

// Two of these carry a pre-rename name, so the trigger name doesn't follow from the table.
const STRAY_TRIGGERS = [
  { name: 'record_portal_one_time_tokens_changelog', table: 'portal_one_time_tokens' },
  { name: 'record_encounter_medications_changelog', table: 'prescriptions' },
  { name: 'record_signers_changelog', table: 'signers_historical' },
];

export async function up(query: QueryInterface): Promise<void> {
  for (const { name, table } of STRAY_TRIGGERS) {
    await query.sequelize.query(`DROP TRIGGER IF EXISTS "${name}" ON "${table}";`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const { name, table } of STRAY_TRIGGERS) {
    await query.sequelize.query(`
      CREATE CONSTRAINT TRIGGER "${name}"
      AFTER INSERT OR UPDATE ON "${table}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
  }
}

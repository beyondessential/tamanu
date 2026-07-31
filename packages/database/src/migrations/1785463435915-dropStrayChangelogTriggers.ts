import { QueryInterface } from 'sequelize';

// Listed per trigger rather than per table: two of these carry a pre-rename name, which is
// why the post-migration hook's name-based check never matched them.
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

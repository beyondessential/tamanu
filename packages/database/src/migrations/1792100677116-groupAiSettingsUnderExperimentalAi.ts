import { QueryInterface } from 'sequelize';

const COPIES = [
  ['ai.enabled', 'formBuilder.enabled'],
  ['ai.anthropicModel', 'formBuilder.model'],
];

const MOVES = [
  ['ai.enabled', 'experimentalAi.enabled', 'global'],
  ['ai.anthropicModel', 'experimentalAi.model', 'global'],
  ['ai.anthropicFastModel', 'formBuilder.fastModel', 'central'],
];

const PREFIX_MOVES = [
  ['patientSummary.', 'experimentalAi.patientSummary.'],
  ['encounterSummary.', 'experimentalAi.encounterSummary.'],
];

export async function up(query: QueryInterface): Promise<void> {
  for (const [from, to] of COPIES) {
    await query.sequelize.query(
      `INSERT INTO settings (key, value, facility_id, scope)
       SELECT :to, value, facility_id, scope FROM settings
       WHERE key = :from AND deleted_at IS NULL;`,
      { replacements: { from, to } },
    );
  }
  for (const [from, to, scope] of MOVES) {
    await query.sequelize.query(
      `UPDATE settings SET key = :to, scope = :scope WHERE key = :from AND deleted_at IS NULL;`,
      { replacements: { from, to, scope } },
    );
  }
  for (const [from, to] of PREFIX_MOVES) {
    await query.sequelize.query(
      `UPDATE settings SET key = :to || substr(key, length(:from) + 1)
       WHERE starts_with(key, :from) AND deleted_at IS NULL;`,
      { replacements: { from, to } },
    );
  }
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('settings');`);
}

export async function down(query: QueryInterface): Promise<void> {
  for (const [from, to] of PREFIX_MOVES) {
    await query.sequelize.query(
      `UPDATE settings SET key = :from || substr(key, length(:to) + 1)
       WHERE starts_with(key, :to) AND deleted_at IS NULL;`,
      { replacements: { from, to } },
    );
  }
  for (const [from, to] of MOVES) {
    await query.sequelize.query(
      `UPDATE settings SET key = :from, scope = 'central' WHERE key = :to AND deleted_at IS NULL;`,
      { replacements: { from, to } },
    );
  }
  // DESTRUCTIVE: the form builder's own switch and model are dropped, so it follows the AI switch and model again
  for (const [, to] of COPIES) {
    await query.sequelize.query(`DELETE FROM settings WHERE key = :to;`, {
      replacements: { to },
    });
  }
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('settings');`);
}

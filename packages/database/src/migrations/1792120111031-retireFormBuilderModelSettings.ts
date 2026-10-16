import { QueryInterface } from 'sequelize';

const RETIRED_KEYS = ['formBuilder.model', 'formBuilder.fastModel'];

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DELETE FROM settings WHERE key IN (:keys) AND scope = 'central';`, {
    replacements: { keys: RETIRED_KEYS },
  });
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: the form builder's model choices are not restored; Canopy chooses them
}

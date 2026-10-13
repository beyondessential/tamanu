import { QueryInterface } from 'sequelize';

const MOVES = [
  ['features.mandateSpecimenType', 'features.labRequest.mandateSpecimenType'],
  ['features.onlyAllowLabPanels', 'features.labRequest.onlyAllowLabPanels'],
];

export async function up(query: QueryInterface): Promise<void> {
  for (const [from, to] of MOVES) {
    await query.sequelize.query(`UPDATE settings SET key = :to WHERE key = :from;`, {
      replacements: { from, to },
    });
  }
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('settings');`);
}

export async function down(query: QueryInterface): Promise<void> {
  for (const [from, to] of MOVES) {
    await query.sequelize.query(`UPDATE settings SET key = :from WHERE key = :to;`, {
      replacements: { from, to },
    });
  }
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('settings');`);
}

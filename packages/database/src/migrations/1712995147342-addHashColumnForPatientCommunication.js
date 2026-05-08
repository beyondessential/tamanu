/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  // await query.sequelize.query(`ALTER TABLE public.patient_communications ADD hash int NULL;`);
  await query.addColumn('patient_communications', 'hash', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('patient_communications', 'hash');
}

/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.createTable('reference_drugs', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    reference_data_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    route: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    units: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  const drugsReferenceData = await query.sequelize.query(`
    SELECT id from reference_data WHERE type = 'drug';
  `);
  console.log(
    drugsReferenceData
  );
  if (drugsReferenceData[0].length) {
    await query.bulkInsert(
      'reference_drugs',
      drugsReferenceData[0].map((it) => ({ reference_data_id: it.id })),
    );
  }
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.dropTable('reference_drugs');
}

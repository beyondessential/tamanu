/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize } from 'sequelize';
/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.createTable('encounter_diets', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
    },
    diet_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
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

  const [encounters] = await query.sequelize.query(
    `SELECT e.id, e.diet_id "dietId" FROM encounters e WHERE e.diet_id IS NOT NULL;`,
    {
      raw: true,
    },
  );

  for (const encounter of encounters) {
    await query.sequelize.query(
      `INSERT INTO encounter_diets (encounter_id, diet_id, created_at, updated_at) VALUES (:encounterId, :dietId, now(), now());`,
      {
        replacements: {
          encounterId: encounter.id,
          dietId: encounter.dietId,
        },
      },
    );
  }

  await query.removeColumn('encounters', 'diet_id');
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.addColumn('encounters', 'diet_id', {
    type: DataTypes.TEXT,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });

  const [
    encounterDiets,
  ] = await query.sequelize.query(
    `SELECT DISTINCT ON (encounter_id) encounter_id, diet_id FROM encounter_diets;`,
    { raw: true },
  );

  for (const encounterDiet of encounterDiets) {
    await query.sequelize.query(
      `UPDATE encounters SET diet_id = :dietId WHERE id = :encounterId;`,
      {
        replacements: {
          encounterId: encounterDiet.encounter_id,
          dietId: encounterDiet.diet_id,
        },
      },
    );
  }

  await query.dropTable('encounter_diets');
}

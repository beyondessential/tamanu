import Sequelize, { DataTypes, QueryInterface } from 'sequelize';
import {
  VISIBILITY_STATUSES,
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('program_registry_condition_categories', {
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 6),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 6),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    code: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    visibility_status: {
      type: Sequelize.TEXT,
      defaultValue: VISIBILITY_STATUSES.CURRENT,
    },
    program_registry_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'program_registries',
        key: 'id',
      },
    },
  });

  await query.addIndex('program_registry_condition_categories', {
    name: 'program_registry_condition_categories_program_registry_id_code',
    unique: true,
    fields: ['program_registry_id', 'code'],
  });

  const ID_PREFIX = 'program-registry-condition-category-';

  const valuesClause = Object.values(PROGRAM_REGISTRY_CONDITION_CATEGORIES)
    .map((code) => `('${code}', '${PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[code]}')`)
    .join(', ');

  // Insert hard coded categories for each existing program registry
  await query.sequelize.query(`
    INSERT INTO program_registry_condition_categories (id, code, name, visibility_status, program_registry_id, created_at, updated_at)
    SELECT
      CONCAT('${ID_PREFIX}', pr.code, '-', category.code),
      category.code,
      category.name,
      '${VISIBILITY_STATUSES.CURRENT}',
      pr.id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM program_registries pr
    CROSS JOIN (
        VALUES ${valuesClause}
    ) AS category(code, name)
  `);

  // Update patient_program_registration_conditions table to replace condition_category with program_registry_condition_category_id
  await query.removeColumn('patient_program_registration_conditions', 'condition_category');

  // Add the column as nullable first, do not add a foreign key constraint yet
  // because otherwise we will create duplicate constraints when performing
  // the changeColumn call
  await query.addColumn(
    'patient_program_registration_conditions',
    'program_registry_condition_category_id',
    {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  );

  // Set the values for existing records
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions
    SET program_registry_condition_category_id = (
      SELECT prc.id
      FROM program_registry_condition_categories prc
      JOIN patient_program_registrations ppr ON prc.program_registry_id = ppr.program_registry_id
      WHERE ppr.id = patient_program_registration_conditions.patient_program_registration_id
      AND prc.code = '${PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN}'
      LIMIT 1
    )
  `);

  // Now make the column non-nullable
  await query.changeColumn(
    'patient_program_registration_conditions',
    'program_registry_condition_category_id',
    {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'program_registry_condition_categories',
        key: 'id',
      },
    },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  // Revert changes to patient_program_registration_conditions table
  await query.removeConstraint(
    'patient_program_registration_conditions',
    'patient_program_registration__program_registry_condition_c_fkey',
  );

  await query.removeColumn(
    'patient_program_registration_conditions',
    'program_registry_condition_category_id',
  );

  await query.addColumn('patient_program_registration_conditions', 'condition_category', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
  });

  // Drop the program_registry_condition_categories table (this will also remove the seeded records)
  await query.dropTable('program_registry_condition_categories');
}

import Sequelize, { DataTypes, QueryInterface } from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('program_registry_categories', {
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
      unique: true,
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

  // Update patient_program_registration_conditions table to replace condition_category with program_registry_category_id
  await query.removeColumn('patient_program_registration_conditions', 'condition_category');

  // Add the column as nullable first
  await query.addColumn('patient_program_registration_conditions', 'program_registry_category_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'program_registry_categories',
      key: 'id',
    },
  });

  await query.addConstraint('patient_program_registration_conditions', {
    fields: ['program_registry_category_id'],
    type: 'foreign key',
    name: 'patient_program_registration_conditions_program_registry_category_id_fkey',
    references: {
      table: 'program_registry_categories',
      field: 'id',
    },
    onDelete: 'restrict',
    onUpdate: 'cascade',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // Revert changes to patient_program_registration_conditions table
  await query.removeConstraint(
    'patient_program_registration_conditions',
    'patient_program_registration_conditions_program_registry_category_id_fkey',
  );

  await query.removeColumn(
    'patient_program_registration_conditions',
    'program_registry_category_id',
  );

  await query.addColumn('patient_program_registration_conditions', 'condition_category', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unknown',
  });

  // Drop the program_registry_categories table (this will also remove the seeded records)
  await query.dropTable('program_registry_categories');
}

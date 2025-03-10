import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create encounter_pause_prescriptions table
  await queryInterface.createTable('encounter_pause_prescriptions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    encounter_prescription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'encounter_prescriptions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    pause_duration: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    pause_time_unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pause_start_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pause_end_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pausing_clinician_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create encounter_pause_prescription_histories table
  await queryInterface.createTable('encounter_pause_prescription_histories', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    encounter_prescription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'encounter_prescriptions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pause_duration: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    pause_time_unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes for better query performance
  await queryInterface.addIndex('encounter_pause_prescriptions', ['encounter_prescription_id']);
  await queryInterface.addIndex('encounter_pause_prescriptions', ['pause_end_date']);
  await queryInterface.addIndex('encounter_pause_prescription_histories', [
    'encounter_prescription_id',
  ]);
  await queryInterface.addIndex('encounter_pause_prescription_histories', ['action_date']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop indexes
  await queryInterface.removeIndex('encounter_pause_prescription_histories', ['action_date']);
  await queryInterface.removeIndex('encounter_pause_prescription_histories', [
    'encounter_prescription_id',
  ]);
  await queryInterface.removeIndex('encounter_pause_prescriptions', ['pause_end_date']);
  await queryInterface.removeIndex('encounter_pause_prescriptions', ['encounter_prescription_id']);

  // Drop tables
  await queryInterface.dropTable('encounter_pause_prescription_histories');
  await queryInterface.dropTable('encounter_pause_prescriptions');
}

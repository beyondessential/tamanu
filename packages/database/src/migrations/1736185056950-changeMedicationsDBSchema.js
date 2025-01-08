import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  // Rename 'encounter_medications' to 'prescriptions'
  await query.renameTable('encounter_medications', 'prescriptions');

  // Drop columns 'qty_morning', 'qty_lunch', 'qty_evening', 'qty_night'
  await query.removeColumn('prescriptions', 'qty_morning');
  await query.removeColumn('prescriptions', 'qty_lunch');
  await query.removeColumn('prescriptions', 'qty_evening');
  await query.removeColumn('prescriptions', 'qty_night');

  // Drop column 'prescription'
  await query.removeColumn('prescriptions', 'prescription');

  // Create 'encounter_prescriptions' table
  await query.createTable('encounter_prescriptions', {
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
    prescription_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'prescriptions',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Populate 'encounter_prescriptions' table
  const prescriptions = await query.sequelize.query(
    'SELECT id, encounter_id FROM prescriptions',
    { type: query.sequelize.QueryTypes.SELECT }
  );

  for (const { id, encounter_id } of prescriptions) {
    await query.insert('encounter_prescriptions', {
      encounter_id,
      prescription_id: id,
    });
  }

  // Drop 'encounter_id' column from 'prescriptions'
  await query.removeColumn('prescriptions', 'encounter_id');

  // Create 'patient_ongoing_prescriptions' table
  await query.createTable('patient_ongoing_prescriptions', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    prescription_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'prescriptions',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}

export async function down(query) {
  // Drop 'patient_ongoing_prescriptions' table
  await query.dropTable('patient_ongoing_prescriptions');

  // Add back 'encounter_id' column to 'prescriptions'
  await query.addColumn('prescriptions', 'encounter_id', {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'encounters',
      key: 'id',
    },
  });

  // Drop 'encounter_prescriptions' table
  await query.dropTable('encounter_prescriptions');

  // Re-add column 'prescription'
  await query.addColumn('prescriptions', 'prescription', { type: DataTypes.STRING });

  // Re-add columns 'qty_morning', 'qty_lunch', 'qty_evening', 'qty_night'
  await query.addColumn('prescriptions', 'qty_morning', { type: DataTypes.INTEGER });
  await query.addColumn('prescriptions', 'qty_lunch', { type: DataTypes.INTEGER });
  await query.addColumn('prescriptions', 'qty_evening', { type: DataTypes.INTEGER });
  await query.addColumn('prescriptions', 'qty_night', { type: DataTypes.INTEGER });

  // Rename 'prescriptions' back to 'encounter_medications'
  await query.renameTable('prescriptions', 'encounter_medications');
}

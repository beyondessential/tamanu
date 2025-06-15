import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface) {
  // Rename 'encounter_medications' to 'prescriptions'
  await query.renameTable('encounter_medications', 'prescriptions');

  // Drop columns 'qty_morning', 'qty_lunch', 'qty_evening', 'qty_night'
  await query.removeColumn('prescriptions', 'qty_morning');
  await query.removeColumn('prescriptions', 'qty_lunch');
  await query.removeColumn('prescriptions', 'qty_evening');
  await query.removeColumn('prescriptions', 'qty_night');

  // Drop column 'prescription'
  await query.removeColumn('prescriptions', 'prescription');

  // Drop column 'is_discharge'
  await query.removeColumn('prescriptions', 'is_discharge');

  // Create 'encounter_prescriptions' table
  await query.createTable('encounter_prescriptions', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
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
    is_discharge: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  await query.sequelize.query(`
    INSERT INTO encounter_prescriptions (encounter_id, prescription_id)
    SELECT encounter_id, id FROM prescriptions
  `);

  // Drop 'encounter_id' column from 'prescriptions'
  await query.removeColumn('prescriptions', 'encounter_id');

  // Create 'patient_ongoing_prescriptions' table
  await query.createTable('patient_ongoing_prescriptions', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
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

export async function down(query: QueryInterface) {
  // Drop 'patient_ongoing_prescriptions' table
  await query.dropTable('patient_ongoing_prescriptions');

  // Add back 'encounter_id' column to 'prescriptions'
  await query.addColumn('prescriptions', 'encounter_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'encounters',
      key: 'id',
    },
  });

  // Populate 'prescriptions' table with 'encounter_id' values
  await query.sequelize.query(`
    UPDATE prescriptions
    SET encounter_id = (SELECT encounter_id FROM encounter_prescriptions
    WHERE prescription_id = prescriptions.id)
  `);

  // Make 'encounter_id' non-nullable after backfilling
  await query.changeColumn('prescriptions', 'encounter_id', {
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

  // Re-add column 'is_discharge'
  await query.addColumn('prescriptions', 'is_discharge', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  // Rename 'prescriptions' back to 'encounter_medications'
  await query.renameTable('prescriptions', 'encounter_medications');
}

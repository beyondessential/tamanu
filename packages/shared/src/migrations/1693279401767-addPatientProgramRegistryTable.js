import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('patient_program_registrations', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    registration_status: {
      type: Sequelize.TEXT,
    },

    patient_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    program_registry_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    clinical_status_id: {
      type: Sequelize.STRING,
    },
    registering_facility_id: {
      type: Sequelize.STRING,
    },
    facility_id: {
      type: Sequelize.STRING,
    },
    village_id: {
      type: Sequelize.STRING,
    },
  });
}

export async function down(query) {
  await query.dropTable('patient_program_registrations');
}

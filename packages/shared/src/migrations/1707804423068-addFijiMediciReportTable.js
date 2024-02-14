import { Sequelize, DataTypes } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'non_fhir_medici_report' };

export async function up(query) {
  await query.createTable(TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    version_id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    upstream_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    last_updated: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    patient_id: {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date_of_birth: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sex: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    patient_billing_type: {
      type: DataTypes.TEXT,
    },
    encounter_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    encounter_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    encounter_end_date: {
      type: DataTypes.DATE,
    },
    discharge_date: {
      type: DataTypes.DATE,
    },
    encounter_type: {
      type: DataTypes.JSONB,
    },
    weight: {
      type: DataTypes.TEXT,
    },
    visit_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    episode_end_status: {
      type: DataTypes.JSONB,
    },
    triage_category: {
      type: DataTypes.TEXT,
    },
    wait_time: {
      type: DataTypes.TEXT,
    },
    departments: {
      type: DataTypes.JSONB,
    },
    locations: {
      type: DataTypes.JSONB,
    },
    reason_for_encounter: {
      type: DataTypes.TEXT,
    },
    diagnoses: {
      type: DataTypes.JSONB,
    },
    medications: {
      type: DataTypes.JSONB,
    },
    vaccinations: {
      type: DataTypes.JSONB,
    },
    procedures: {
      type: DataTypes.JSONB,
    },
    lab_requests: {
      type: DataTypes.JSONB,
    },
    imaging_requests: {
      type: DataTypes.JSONB,
    },
    notes: {
      type: DataTypes.JSONB,
    },
  });

  await query.addIndex(TABLE, ['id', 'version_id']);
  await query.addIndex(TABLE, ['upstream_id']);
}

export async function down(query) {
  await query.dropTable(TABLE);
}

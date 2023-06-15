import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('patient_birth_data', {
    id: {
      type: Sequelize.STRING,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    patient_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
      unique: true, // to only allow 1 birth_data for 1 patient
    },
    birth_weight: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    birth_length: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    birth_delivery_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    gestational_age_estimate: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    apgar_score_one_minute: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    apgar_score_five_minutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    apgar_score_ten_minutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    time_of_birth: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    clinician_at_birth_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: true,
    },
    birth_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });
}

export async function down(query) {
  await query.dropTable('patient_birth_data');
}

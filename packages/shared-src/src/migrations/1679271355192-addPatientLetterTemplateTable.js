import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('patient_letter_templates', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: Sequelize.STRING,
      // allowNull: false,
    },
    body: {
      type: Sequelize.STRING,
      // allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
    },
  });
}

export async function down(query) {
  await query.dropTable('patient_letter_templates');
}

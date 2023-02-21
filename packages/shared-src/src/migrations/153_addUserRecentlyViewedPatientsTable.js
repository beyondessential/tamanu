import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('user_recently_viewed_patients', {
    id: {
      type: Sequelize.fn('uuid_generate_v4'),
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    user_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'cascade',
      allowNull: false,
    },
    patient_id: {
      type: Sequelize.STRING,
      references: {
        model: 'patients',
        key: 'id',
      },
      onDelete: 'cascade',
      allowNull: false,
    },
  });
}

export async function down(query) {
  await query.dropTable('user_recently_viewed_patients');
}

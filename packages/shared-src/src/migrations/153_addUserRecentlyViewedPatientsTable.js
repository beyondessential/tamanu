import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('user_recently_viewed_patients', {
    id: {
      type: Sequelize.UUID,
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
    user_id: {
      type: Sequelize.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'cascade',
      allowNull: false,
    },
    patient_id: {
      type: Sequelize.UUID,
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

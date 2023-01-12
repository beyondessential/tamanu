import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('refresh_tokens', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
}

export async function down(query) {
  await query.dropTable('refresh_tokens');
}

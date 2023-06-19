import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('refresh_tokens', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    refresh_id: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    device_id: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  await query.addIndex('refresh_tokens', {
    name: 'refresh_tokens_user_id_device_id',
    fields: ['user_id', 'device_id'],
    unique: true,
  });
}

export async function down(query) {
  await query.dropTable('refresh_tokens');
}

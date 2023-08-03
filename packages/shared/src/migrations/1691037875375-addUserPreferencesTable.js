import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('user_preferences', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
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
    selected_graphed_vitals_on_filter: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });
  await query.addConstraint('user_preferences', {
    fields: ['user_id'],
    type: 'unique',
  });
}

export async function down(query) {
  await query.dropTable('user_preferences');
}

import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('user_preferences', {
    // User preference records use a user_id as the primary key, acting as a
    // db-level enforcement of one per user, and simplifying sync
    id: {
      type: 'TEXT GENERATED ALWAYS AS ("user_id") STORED',
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
      primaryKey: true,
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

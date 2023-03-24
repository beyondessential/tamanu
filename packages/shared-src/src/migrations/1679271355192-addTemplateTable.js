import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('templates', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
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
    template_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    date_created: {
      type: 'date_string',
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
    },
    body: {
      type: Sequelize.STRING,
    },
    created_by_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: true,
    },
  });
}

export async function down(query) {
  await query.dropTable('templates');
}

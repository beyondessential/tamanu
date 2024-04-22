import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('lab_request_attachments', {
    id: {
      type: Sequelize.STRING,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    attachment_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lab_request_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    replaced_by: {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'lab_request_attachments',
        key: 'id',
      },
    },
  });
}

export async function down(query) {
  await query.dropTable('lab_request_attachments');
}

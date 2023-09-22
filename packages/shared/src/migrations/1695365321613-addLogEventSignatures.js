import { Sequelize } from 'sequelize';

export async function up(query) {
  // write your up migration here

  await query.createTable('log_signatures', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    keys: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    reviewed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    safe: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    forbid: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // unused in application but some system bits assume they exist
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
      defaultValue: Sequelize.NOW,
    },
  });
}

export async function down(query) {
  await query.dropTable('log_signatures');
}

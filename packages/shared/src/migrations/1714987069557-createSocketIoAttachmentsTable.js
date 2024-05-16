/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize } from 'sequelize';
import config from 'config';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  if (config.serverFacilityId) return;

  await query.createTable('socket_io_attachments', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
    },
    payload: {
      type: DataTypes.BLOB,
    },
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  if (config.serverFacilityId) return;

  await query.dropTable('socket_io_attachments');
}

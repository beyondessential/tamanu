/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.createTable('socket_io_attachments', {
    id: {
      type: DataTypes.BIGINT,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
  await query.dropTable('socket_io_attachments');
}

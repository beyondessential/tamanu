import Sequelize from 'sequelize';
import crypto from 'crypto';

/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.createTable('vaccine_status_threshold', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    threshold: {
      type: Sequelize.DOUBLE,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('SCHEDULED', 'UPCOMING', 'DUE', 'OVERDUE', 'MISSED'),
      allowNull: false,
      unique: true,
    },
  });

  await query.bulkInsert('vaccine_status_threshold', [
    {
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      threshold: 28,
      status: 'SCHEDULED',
    },
    {
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      threshold: 7,
      status: 'UPCOMING',
    },
    {
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      threshold: -7,
      status: 'DUE',
    },
    {
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      threshold: -55,
      status: 'OVERDUE',
    },
    {
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      threshold: '-Infinity',
      status: 'MISSED',
    },
  ]);
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.dropTable('vaccine_status_threshold');
}

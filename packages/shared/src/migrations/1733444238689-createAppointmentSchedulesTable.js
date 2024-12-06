/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('appointment_schedules', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    start_date: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    until_date: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    interval: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    days_of_week: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      comment: 'Days of the week (e.g., ["MO", "WE", "FR"]). Null for non-weekly recurrences.',
    },
    nth_weekday: {
      type: Sequelize.STRING,
      allowNull: true,
      comment:
        'Ordinal weekday in a month (e.g., "2TU" for 2nd Tuesday, "-1FR" for Last Friday). Null for weekly patterns.',
    },
    occurrence_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.fn('NOW'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.fn('NOW'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
  await query.addColumn('appointments', 'schedule_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'appointment_schedules',
      key: 'id',
    },
  });
  await query.addIndex('appointments', ['schedule_id']);
}

export async function down(query) {
  await query.removeIndex('appointments', ['schedule_id']);
  await query.removeColumn('appointments', 'schedule_id');
  await query.dropTable('appointment_schedules');
}

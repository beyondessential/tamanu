/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';
/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('surveys', 'notifiable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn('surveys', 'notify_email_addresses', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  });

  await query.addColumn('survey_responses', 'notified', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('surveys', 'notifiable');
  await query.removeColumn('surveys', 'notify_email_addresses');
  await query.removeColumn('survey_responses', 'notified');
}

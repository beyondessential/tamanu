/* eslint-disable custom-date-rules/no-timestamp-with-timezone */
import Sequelize from 'sequelize';

const ADMINISTERED_VACCINE_TABLE_NAME = 'administered_vaccines';
const IMAGING_REQUEST_AREAS_TABLE_NAME = 'imaging_request_areas';

export async function up(query) {
  await query.removeColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'marked_for_push');
  await query.removeColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'is_pushing');
  await query.removeColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'pushed_at');
  await query.removeColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'pulled_at');

  await query.removeColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'marked_for_push');
  await query.removeColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'is_pushing');
  await query.removeColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'pushed_at');
  await query.removeColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'pulled_at');
}

export async function down(query) {
  await query.addColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'marked_for_push', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'is_pushing', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.addColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'pushed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await query.addColumn(ADMINISTERED_VACCINE_TABLE_NAME, 'pulled_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });

  await query.addColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'marked_for_push', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'is_pushing', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.addColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'pushed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await query.addColumn(IMAGING_REQUEST_AREAS_TABLE_NAME, 'pulled_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

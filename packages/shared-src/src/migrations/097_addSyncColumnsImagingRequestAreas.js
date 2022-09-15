import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('imaging_request_areas', 'marked_for_push', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn('imaging_request_areas', 'is_pushing', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.addColumn('imaging_request_areas', 'pushed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await query.addColumn('imaging_request_areas', 'pulled_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('imaging_request_areas', 'marked_for_push');
  await query.removeColumn('imaging_request_areas', 'is_pushing');
  await query.removeColumn('imaging_request_areas', 'pushed_at');
  await query.removeColumn('imaging_request_areas', 'pulled_at');
}

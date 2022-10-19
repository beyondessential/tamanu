import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('imaging_requests', 'priority', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE imaging_requests
    SET priority = 'urgent'
    WHERE urgent IS TRUE;
  `);

  await query.sequelize.query(`
    UPDATE imaging_requests
    SET priority = 'routine'
    WHERE urgent IS FALSE;
  `);

  await query.removeColumn('imaging_requests', 'urgent');
}

export async function down(query) {
  await query.addColumn('imaging_requests', 'urgent', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.sequelize.query(`
    UPDATE imaging_requests
    SET urgent = TRUE
    WHERE priority = 'urgent';
  `);

  await query.sequelize.query(`
    UPDATE imaging_requests
    SET urgent = FALSE
    WHERE priority = 'routine';
  `);

  await query.removeColumn('imaging_requests', 'priority');
}

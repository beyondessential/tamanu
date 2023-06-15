const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.changeColumn('lab_requests', 'status', {
      type: Sequelize.STRING,
    });
    await query.sequelize.query('DROP TYPE IF EXISTS "enum_lab_requests_status";');
    await query.changeColumn('lab_requests', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'reception_pending',
    });
  },

  down: async query => {
    // technically speaking, migrating a string to an enum isn't reversible, so we make a temp column...
    await query.renameColumn('lab_requests', 'status', 'status_old');
    // ...recreate the enum column and default it to reception_pending...
    await query.addColumn('lab_requests', 'status', {
      type: Sequelize.ENUM([
        'reception_pending',
        'results_pending',
        'to_be_verified',
        'verified',
        'published',
      ]),
      defaultValue: 'reception_pending',
    });
    // ...set status based on the temp column and cast to enum.
    await query.sequelize.query(
      `UPDATE lab_requests SET status = status_old::enum_lab_requests_status`,
    );
    // ...and get rid of the old column
    await query.removeColumn('lab_requests', 'status_old');
  },
};

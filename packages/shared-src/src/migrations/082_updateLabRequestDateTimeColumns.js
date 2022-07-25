const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // 1. Create legacy columns
    await query.addColumn('lab_requests', 'sample_time_legacy', {
      type: Sequelize.DATE,
    });

    // 2. Copy data to legacy columns for backup
    await query.sequelize.query(`UPDATE lab_requests SET sample_time_legacy = sample_time;`);

    // 3.Change column types from of original columns from date to string & convert data to string
    await query.sequelize.query(
      `ALTER TABLE lab_requests
       ALTER COLUMN sample_time TYPE VARCHAR
       USING TO_CHAR(sample_time, 'YYYY-MM-DD HH:mm:ss');`,
    );
  },
  down: async query => {
    // 1. Clear data from string column
    await query.sequelize.query(
      `ALTER TABLE "lab_requests" ALTER COLUMN "sample_time" TYPE timestamp with time zone USING sample_time_legacy;`,
    );

    // 2. Remove legacy columns
    await query.removeColumn('lab_requests', 'sample_time_legacy');
  },
};

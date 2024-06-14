/* eslint-disable no-unused-vars */
// remove the above line

export async function up(query) {
  await query.sequelize.query(`
    ALTER TABLE imaging_requests
    ALTER COLUMN reason_for_cancellation TYPE CHARACTER VARYING(1024);
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE imaging_requests
    ALTER COLUMN reason_for_cancellation TYPE CHARACTER VARYING(31);
  `);
}

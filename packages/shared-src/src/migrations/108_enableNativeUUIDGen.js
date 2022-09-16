module.exports = {
  up: async query => {
    await query.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
  },
  down: async query => {
    await query.sequelize.query(`
      DROP EXTENSION IF EXISTS "uuid-ossp";
    `);
  },
};

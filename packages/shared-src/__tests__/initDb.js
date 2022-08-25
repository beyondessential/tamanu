import { initDatabase } from 'shared/services/database';

const config = {
  sqlitePath: `/tmp/tamanu-shared-src-tests-${process.env.JEST_WORKER_ID}.db`,
  testMode: true,
};

export const initDb = async (overrides = {}) => {
  const db = await initDatabase({ ...config, ...overrides });
  await db.sequelize.drop({});
  await db.sequelize.sync({ force: true });
  return db;
};

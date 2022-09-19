import config from 'config';
import { initDatabase } from 'shared/services/database';

export const initDb = async (overrides = {}) => {
  const db = await initDatabase({ ...config.db, ...overrides });
  await db.sequelize.sync({ force: true });
  return db;
};

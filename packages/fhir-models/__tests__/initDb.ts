import config from 'config';
import { initDatabase } from 'shared/services/database';
import type { Sequelize } from 'sequelize';
import * as models from '../src/models';

export type Models = typeof models;
export interface Context {
  sequelize: Sequelize;
  models: Models;
}

export async function initDb(overrides = {}): Promise<Context> {
  const db = await initDatabase({ ...config.db, ...overrides });
  await db.sequelize.sync({ force: true });
  return db;
}

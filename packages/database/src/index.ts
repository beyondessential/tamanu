export * from './models/index.ts';
export * from './utils/index.ts';
export * from './sync/index.ts';

export type Models = typeof import('./models');
import type * as sequelize from 'sequelize';
export interface Sequelize extends sequelize.Sequelize {
  models: Models;
  isInsideTransaction(): boolean;
  migrate: (
    // eslint-disable-next-line no-unused-vars
    direction: 'up' | 'down' | 'downToLastReversibleMigration' | 'redoLatest',
  ) => Promise<void>;
}

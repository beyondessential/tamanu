export * from './models';
export * from './utils';
export * from './sync';

export type Models = typeof import('./models');
import * as sequelize from 'sequelize';
export interface Sequelize extends sequelize.Sequelize {
  models: Models;
  isInsideTransaction(): boolean;
  migrate: (
    // eslint-disable-next-line no-unused-vars
    direction: 'up' | 'down' | 'downToLastReversibleMigration' | 'redoLatest',
  ) => Promise<void>;
}

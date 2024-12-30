import { Sequelize } from 'sequelize';
import type { SYNC_SESSION_DIRECTION } from "../sync/constants";
import type { Models } from './model';

export interface SessionConfig {
  syncAllLabRequests: boolean;
}

export type SyncSessionDirectionValues = typeof SYNC_SESSION_DIRECTION[keyof typeof SYNC_SESSION_DIRECTION];

export interface Store {
  sequelize: Sequelize;
  models: Models;
}

import type { Models } from '@tamanu/database';
import type { LimitFunction } from 'p-limit';

export interface CommonParams {
  models: Models;
  limit: LimitFunction;
}

export type ExtendedCommonParams<T> = Partial<Omit<T, keyof CommonParams>> & CommonParams;

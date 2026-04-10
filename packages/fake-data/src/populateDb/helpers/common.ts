import type { Models } from '@tamanu/database';

export type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;

export interface CommonParams {
  models: Models;
  limit: LimitFunction;
}

export type ExtendedCommonParams<T> = Partial<Omit<T, keyof CommonParams>> & CommonParams;

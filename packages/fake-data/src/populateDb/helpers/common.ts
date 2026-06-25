import type { Models } from '@tamanu/database';

export interface CommonParams {
  models: Models;
}

export type ExtendedCommonParams<T> = Partial<Omit<T, keyof CommonParams>> & CommonParams;

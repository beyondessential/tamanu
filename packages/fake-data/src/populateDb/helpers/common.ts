import pLimit from 'p-limit';
import type { Models } from '@tamanu/database';

export type LimitFunction = ReturnType<typeof pLimit>;

export interface CommonParams {
  models: Models;
  limit: LimitFunction;
}

export type ExtendedCommonParams<T> = Partial<Omit<T, keyof CommonParams>> & CommonParams;

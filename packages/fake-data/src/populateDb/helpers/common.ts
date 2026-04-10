import type { Models } from '@tamanu/database';

export type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;

export function createLimiter(concurrency: number): LimitFunction {
  let active = 0;
  const queue: Array<() => void> = [];
  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(resolve, reject).finally(() => {
          active--;
          if (queue.length > 0) queue.shift()!();
        });
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
}

export interface CommonParams {
  models: Models;
  limit: LimitFunction;
}

export type ExtendedCommonParams<T> = Partial<Omit<T, keyof CommonParams>> & CommonParams;

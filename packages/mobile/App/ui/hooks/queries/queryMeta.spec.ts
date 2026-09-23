import { QueryClient } from '@tanstack/react-query';

import { dependsOn, invalidateQueriesForTables, shouldInvalidateForTables } from './queryMeta';

// TanStack Query resolves queries via timers that the globally enabled fake timers would stall
jest.useRealTimers();

const model = (tableName: string) => ({ getTableName: () => tableName });

describe('dependsOn', () => {
  it('maps models to their table names', () => {
    expect(dependsOn(model('patients'), model('encounters'))).toEqual({
      tables: ['patients', 'encounters'],
    });
  });

  it('deduplicates tables', () => {
    expect(dependsOn(model('patients'), model('patients'))).toEqual({ tables: ['patients'] });
  });

  it('produces an empty tag with no models', () => {
    expect(dependsOn()).toEqual({ tables: [] });
  });
});

describe('shouldInvalidateForTables', () => {
  const touched = new Set(['encounters']);

  it('invalidates untagged queries', () => {
    expect(shouldInvalidateForTables({}, touched)).toBe(true);
    expect(shouldInvalidateForTables({ meta: {} }, touched)).toBe(true);
  });

  it('never invalidates queries tagged with no tables', () => {
    expect(shouldInvalidateForTables({ meta: { tables: [] } }, touched)).toBe(false);
  });

  it('invalidates queries reading a touched table', () => {
    expect(
      shouldInvalidateForTables({ meta: { tables: ['patients', 'encounters'] } }, touched),
    ).toBe(true);
  });

  it('leaves queries reading only untouched tables alone', () => {
    expect(shouldInvalidateForTables({ meta: { tables: ['patients'] } }, touched)).toBe(false);
  });
});

describe('invalidateQueriesForTables', () => {
  it('marks only the matching and untagged queries as invalidated', async () => {
    const queryClient = new QueryClient();
    const prefetch = (queryKey: string[], meta?: { tables: string[] }) =>
      queryClient.prefetchQuery({ queryKey, queryFn: async () => 'data', meta });
    await Promise.all([
      prefetch(['encounters'], { tables: ['encounters'] }),
      prefetch(['patients'], { tables: ['patients'] }),
      prefetch(['remote'], { tables: [] }),
      prefetch(['untagged']),
    ]);

    await invalidateQueriesForTables(queryClient, new Set(['encounters']));

    const isInvalidated = (key: string) => queryClient.getQueryState([key])?.isInvalidated;
    expect(isInvalidated('encounters')).toBe(true);
    expect(isInvalidated('untagged')).toBe(true);
    expect(isInvalidated('patients')).toBe(false);
    expect(isInvalidated('remote')).toBe(false);
  });
});

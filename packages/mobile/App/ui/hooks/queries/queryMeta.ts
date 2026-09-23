import type { QueryClient } from '@tanstack/react-query';

import type { BaseModelWithoutId } from '~/models/BaseModelWithoutId';

/** Structural, so tests can pass `{ getTableName: () => 'patients' }` */
export type TableSource = Pick<typeof BaseModelWithoutId, 'getTableName'>;

/**
 * Query `meta` understood by the sync-driven cache invalidation in `BackendContext`.
 *
 * @privateRemarks Must be a `type` alias rather than an `interface`: TanStack only honours
 * `Register['queryMeta']` if it extends `Record<string, unknown>`, which an interface with only
 * optional properties does not (no implicit index signature).
 */
export type LocalQueryMeta = {
  /**
   * Names of the database tables this query reads. When a sync ends, the query is invalidated
   * only if one of these tables received rows.
   *
   * - `undefined` (untagged): dependencies unknown, so the query is invalidated after every sync.
   * - `[]`: the query doesn’t read the local database (e.g. a remote request), so sync never
   *   invalidates it.
   */
  tables?: readonly string[];
};

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: LocalQueryMeta;
  }
}

/**
 * Declare which models a query reads, for sync-driven cache invalidation.
 *
 * Call from within the hook body. Model table names come from TypeORM metadata, which is only
 * available once the database is connected, so this must not run at module scope.
 *
 * @example
 * useQuery({
 *   queryKey: patientKeys.issues(patientId),
 *   queryFn: () => Database.models.PatientIssue.find({ where: { patient: { id: patientId } } }),
 *   meta: dependsOn(Database.models.PatientIssue),
 * });
 */
export const dependsOn = (...models: TableSource[]): LocalQueryMeta => ({
  tables: [...new Set(models.map(model => model.getTableName()))],
});

export const shouldInvalidateForTables = (
  query: { meta?: LocalQueryMeta },
  touchedTables: ReadonlySet<string>,
): boolean => {
  const tables = query.meta?.tables;
  if (tables === undefined) return true;
  return tables.some(table => touchedTables.has(table));
};

/**
 * Invalidate every query that reads one of the given tables, plus every untagged query (see
 * {@link LocalQueryMeta.tables}).
 */
export const invalidateQueriesForTables = (
  queryClient: QueryClient,
  touchedTables: ReadonlySet<string>,
): Promise<void> =>
  queryClient.invalidateQueries({
    predicate: query => shouldInvalidateForTables(query, touchedTables),
  });

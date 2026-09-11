import { InvalidParameterError } from '@tamanu/errors';

/**
 * Outgoing pull pages are ordered by (dependency sort order, snapshot id), so a resume cursor has
 * to carry both parts: snapshot ids ascend within a table, but a later table's ids can be lower
 * than an earlier table's. Paging on the id alone silently skips records.
 *
 * The encoded form is opaque to clients — it is only ever produced and consumed here, so both the
 * polling and streaming pull endpoints stay in step with what the query expects.
 */
export type SnapshotCursor = {
  sortOrder: number;
  id: string | number;
};

export const encodeSnapshotCursor = ({ sortOrder, id }: SnapshotCursor): string =>
  btoa(JSON.stringify({ sortOrder, id }));

export const decodeSnapshotCursor = (cursor?: string | null): Partial<SnapshotCursor> => {
  if (!cursor) return {};

  // the cursor arrives as a query parameter, so a malformed one is a bad request rather than a
  // server fault, and it says which parameter to look at
  let decoded;
  try {
    decoded = JSON.parse(atob(cursor));
  } catch (error) {
    throw new InvalidParameterError(
      `fromId is not a valid pull cursor: ${(error as Error).message}`,
    );
  }

  // Both parts go into a SQL comparison against (sort_order, id), so a cursor that decodes but
  // carries the wrong types is still the client's mistake — checked here rather than left to fail as
  // a query error, which reaches the client as a server fault and says nothing about the cause.
  const { sortOrder, id } = decoded ?? {};
  if (!Number.isInteger(sortOrder) || !['string', 'number'].includes(typeof id)) {
    throw new InvalidParameterError(
      'fromId is not a valid pull cursor: expected a sort order and a record id',
    );
  }

  return { sortOrder, id };
};

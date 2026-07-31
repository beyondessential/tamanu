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
  try {
    return JSON.parse(atob(cursor));
  } catch (error) {
    throw new InvalidParameterError(
      `fromId is not a valid pull cursor: ${(error as Error).message}`,
    );
  }
};

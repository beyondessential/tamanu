import { InvalidParameterError } from '@tamanu/errors';

// Pull pages are ordered by (sort_order, id) and a later table's ids can be lower than an
// earlier table's, so paging on the id alone skips records.
export type SnapshotCursor = {
  sortOrder: number;
  id: string | number;
};

export const encodeSnapshotCursor = ({ sortOrder, id }: SnapshotCursor): string =>
  btoa(JSON.stringify({ sortOrder, id }));

export const decodeSnapshotCursor = (cursor?: string | null): Partial<SnapshotCursor> => {
  if (!cursor) return {};

  let decoded;
  try {
    decoded = JSON.parse(atob(cursor));
  } catch (error) {
    throw new InvalidParameterError(
      `fromId is not a valid pull cursor: ${(error as Error).message}`,
    );
  }

  const { sortOrder, id } = decoded ?? {};
  if (!Number.isInteger(sortOrder) || !['string', 'number'].includes(typeof id)) {
    throw new InvalidParameterError(
      'fromId is not a valid pull cursor: expected a sort order and a record id',
    );
  }

  return { sortOrder, id };
};

import { describe, expect, it } from 'vitest';
import { InvalidParameterError } from '@tamanu/errors';

import { decodeSnapshotCursor, encodeSnapshotCursor } from '../../src/sync/snapshotCursor';

describe('snapshot cursor', () => {
  it('round-trips both parts of the cursor', () => {
    const cursor = encodeSnapshotCursor({ sortOrder: 4, id: '1234' });

    expect(decodeSnapshotCursor(cursor)).toEqual({ sortOrder: 4, id: '1234' });
  });

  it('reads a missing cursor as the start of the snapshot', () => {
    expect(decodeSnapshotCursor()).toEqual({});
    expect(decodeSnapshotCursor(null)).toEqual({});
    expect(decodeSnapshotCursor('')).toEqual({});
  });

  it.each([
    ['not base64 at all', 'not-a-cursor'],
    ['base64 of something that is not json', btoa('still not a cursor')],
  ])('rejects a cursor that is %s', (_description, cursor) => {
    // the cursor is a query parameter, so a malformed one is the client's mistake, not a fault
    expect(() => decodeSnapshotCursor(cursor)).toThrow(InvalidParameterError);
  });
});

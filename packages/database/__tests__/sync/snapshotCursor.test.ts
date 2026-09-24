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

  // Both parts are compared against (sort_order, id) in SQL, so a cursor that decodes cleanly but
  // carries the wrong types would otherwise reach the database and come back as a server fault.
  it.each([
    ['a sort order that is not a number', { sortOrder: 'x', id: '1234' }],
    ['a fractional sort order', { sortOrder: 1.5, id: '1234' }],
    ['an id that is neither string nor number', { sortOrder: 1, id: {} }],
    ['no id at all', { sortOrder: 1 }],
    ['no sort order at all', { id: '1234' }],
    ['not an object', 1234],
  ])('rejects a decodable cursor with %s', (_description, payload) => {
    expect(() => decodeSnapshotCursor(btoa(JSON.stringify(payload)))).toThrow(
      InvalidParameterError,
    );
  });

  it('accepts an id that arrives as a number', () => {
    // bigint ids come back from postgres as strings, but nothing stops a client sending the number
    expect(decodeSnapshotCursor(btoa(JSON.stringify({ sortOrder: 2, id: 1234 })))).toEqual({
      sortOrder: 2,
      id: 1234,
    });
  });
});

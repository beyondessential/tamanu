/**
 * Sync cursors maintain a position in a queue of records requiring sync
 * The primary cursor is the `updatedAt` value, but the `id` is also included to resolve conflicts
 */

import { Op } from 'sequelize';

const SEPARATOR = ';'; // some token that will never be in a timestamp or id

// creates a 'timestamp;id' style cursor from the max record
export const getSyncCursorFromRecord = ({ updatedAt, id }) =>
  `${updatedAt.getTime()}${SEPARATOR}${id}`;

// splits 'timestamp;id' into [timestamp, id]
export const parseSyncCursor = cursor => (cursor ? cursor.split(SEPARATOR) : [0]);

const ensureNumber = input => {
  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    return parsed; // might be NaN
  }
  return input;
};

export const syncCursorToWhereCondition = cursor => {
  const [fromUpdatedAt = '0', afterId = ''] = parseSyncCursor(cursor);
  return {
    [Op.or]: [
      {
        // updatedAt is either strictly greater than the cursor
        updatedAt: { [Op.gt]: ensureNumber(fromUpdatedAt) },
      },
      {
        // or equal to, but with the id breaking any conflicts
        updatedAt: ensureNumber(fromUpdatedAt),
        id: { [Op.gt]: afterId },
      },
    ],
  };
};

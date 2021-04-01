/**
 * Sync cursors maintain a position in a queue of records requiring sync
 * The primary cursor is the `updatedAt` value, but the `id` is also included to resolve conflicts
 */

import { Op } from 'sequelize';

const SEPARATOR = ';'; // some token that will never be in a timestamp or id

// creates a 'timestamp;id' style cursor from the max record
export const getSyncCursorFromRecord = ({ updatedAt, id }) =>
  `${updatedAt.getTime()}${SEPARATOR}${id}`;

const parseNumberOrZero = input => {
  if (Number.isFinite(input)) {
    return input; // already a number
  }

  const parsed = parseInt(input, 10);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0; // unable to parse a number, return 0 instead
};

// splits 'timestamp;id' into [timestamp, id]
const parseSyncCursor = cursor => {
  const [fromUpdatedAtString = '0', afterId = ''] = cursor ? cursor.split(SEPARATOR) : [];
  return [parseNumberOrZero(fromUpdatedAtString), afterId];
};

export const syncCursorToWhereCondition = cursor => {
  const [fromUpdatedAt, afterId] = parseSyncCursor(cursor);
  return {
    [Op.or]: [
      {
        // updatedAt is either strictly greater than the cursor
        updatedAt: { [Op.gt]: fromUpdatedAt },
      },
      {
        // or equal to, but with the id breaking any conflicts
        updatedAt: fromUpdatedAt,
        id: { [Op.gt]: afterId },
      },
    ],
  };
};

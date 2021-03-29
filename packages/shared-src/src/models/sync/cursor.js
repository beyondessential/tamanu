/**
 * Sync cursors maintain a position in a queue of records requiring sync
 * The primary cursor is the `updatedAt` value, but the `id` is also included to resolve conflicts
 */

import { Op } from 'sequelize';

const SEPARATOR = ';'; // some token that will never be in a timestamp or id

// creates a 'timestamp;id' style cursor from the max record
export const getSyncCursorFromRecord = ({ data }) =>
  `${data.updatedAt.toString()}${SEPARATOR}${data.id}`;

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
  const where = {};
  const [fromUpdatedAt, afterId] = parseSyncCursor(cursor);
  if (fromUpdatedAt) {
    where.updatedAt = { [Op.gte]: ensureNumber(fromUpdatedAt) };
  }
  if (afterId) {
    where.id = { [Op.gt]: afterId };
  }
  return where;
};

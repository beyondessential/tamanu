import config from 'config';
import { Op } from 'sequelize';

const CHUNK_SIZE = config.sync.maxRecordsPerSnapshotChunk;

const getBoundariesForNumberOfChars = async (model, since, minId, maxId, numberOfChars = 1) => {
  const { sequelize, tableName } = model;
  const [results] = await sequelize.query(
    `
      SELECT substring(id, 1, ${numberOfChars}) as substring, count(*) as count
      FROM ${tableName}
      WHERE updated_at_sync_tick > :since
      AND id >= :minId
      AND id <= :maxId
      GROUP BY substring
    `,
    {
      replacements: {
        since,
        minId,
        maxId,
      },
    },
  );

  const boundaries = await Promise.all(
    results.map(async ({ substring, count }) => {
      const minChunkId = substring;
      const maxChunkId = `${substring}x`; // TODO where x is largest character in the charset
      if (count <= CHUNK_SIZE) {
        return [minChunkId, maxChunkId];
      }
      return getBoundariesForNumberOfChars(model, since, minChunkId, maxChunkId, numberOfChars + 1);
    }),
  );
  return boundaries.flat();
};

export const getSnapshotChunkBoundaries = async (model, since) => {
  // if the number of records since the last sync tick is less than the chunk size, just return the min and max ids
  const where = { updated_at_sync_tick: { [Op.gt]: since } };
  const minId = await model.min('id', { where });
  const maxId = await model.max('id', { where });
  const totalCount = await model.count({
    where,
  });
  if (totalCount <= CHUNK_SIZE) {
    return [[minId, maxId]];
  }

  // otherwise, break the records into chunks
  return getBoundariesForNumberOfChars(model, since, minId, maxId);
};

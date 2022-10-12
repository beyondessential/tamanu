import { sortInDependencyOrder } from '../models/sortInDependencyOrder';

export const getOutgoingChangesForSession = async (store, sessionId, direction, offset, limit) => {
  const sortedModels = sortInDependencyOrder(store.models);
  const recordTypeOrder = sortedModels.map(m => m.tableName);
  const [results] = await store.sequelize.query(
    `
      SELECT id,
        record_id as "recordId",
        record_type as "recordType",
        is_deleted as "isDeleted",
        session_id as "sessionId",
        data
      FROM sync_session_records
      WHERE session_id = :sessionId
        AND direction = :direction
      ORDER BY array_position(ARRAY[:recordTypeOrder]::varchar[], record_type), id ASC
      LIMIT :limit
      OFFSET :offset
    `,
    {
      replacements: {
        sessionId,
        direction,
        limit,
        offset,
        recordTypeOrder,
      },
    },
  );

  return results;
};

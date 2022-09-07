import { sortInDependencyOrder } from '../models/sortInDependencyOrder';

export const getOutgoingChangesForSession = async (
  store,
  sessionIndex,
  direction,
  offset,
  limit,
) => {
  const sortedModels = sortInDependencyOrder(store.models);
  const recordTypeOrder = sortedModels.map(m => m.tableName);
  const [results] = await store.sequelize.query(
    `
      SELECT id, 
        record_id as "recordId", 
        record_type as "recordType", 
        is_deleted as "isDeleted", 
        session_index as "sessionIndex",
        data
      FROM session_sync_records
      WHERE session_index = :sessionIndex
        AND direction = :direction
      ORDER BY array_position(ARRAY[:recordTypeOrder]::varchar[], record_type), id ASC
      LIMIT :limit
      OFFSET :offset
    `,
    {
      replacements: {
        sessionIndex,
        direction,
        limit,
        offset,
        recordTypeOrder,
      },
    },
  );

  return results;
};

import { groupBy } from 'lodash';
import { sortInDependencyOrder } from '../models/sortInDependencyOrder';

export const getSessionOutgoingChanges = async (store, sessionIndex, direction, offset, limit) => {
  const sortedModels = sortInDependencyOrder(store.models);
  const dependencyList = sortedModels.map(m => m.tableName);
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
      ORDER BY array_position(ARRAY[:dependencyList]::varchar[], record_type), id ASC
      LIMIT :limit
      OFFSET :offset
    `,
    {
      replacements: {
        sessionIndex,
        direction,
        limit,
        offset,
        dependencyList,
      },
    },
  );

  const recordTypes = Object.keys(groupBy(results, 'recordType'));
  console.log('recordTypes', recordTypes);
  return results;
};

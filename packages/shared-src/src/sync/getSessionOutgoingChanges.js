export const getSessionOutgoingChanges = async (store, sessionIndex, direction, offset, limit) => {
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
      ORDER BY id ASC
      LIMIT :limit
      OFFSET :offset
    `,
    {
      replacements: {
        sessionIndex,
        direction,
        limit,
        offset,
      },
    },
  );

  return results;
};

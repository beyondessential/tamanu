export const getOutgoingChangesForSession = async (store, sessionId, direction, offset, limit) => {
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
      ORDER BY id ASC
      LIMIT :limit
      OFFSET :offset
    `,
    {
      replacements: {
        sessionId,
        direction,
        limit,
        offset,
      },
    },
  );

  return results;
};

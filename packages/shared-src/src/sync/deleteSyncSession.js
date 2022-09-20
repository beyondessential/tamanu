export const deleteSyncSession = async (store, sessionId) => {
  // Explicitly delete all the session_sync_records and sync_sessions because
  // they are not synced, and we should free up the storage because the number of records
  // can be very large
  await store.sequelize.query(
    `
      DELETE FROM session_sync_records
      WHERE session_id = :sessionId
    `,
    {
      replacements: {
        sessionId,
      },
    },
  );

  await store.sequelize.query(
    `
      DELETE FROM sync_sessions
      WHERE id = :sessionId
    `,
    {
      replacements: {
        sessionId,
      },
    },
  );
};

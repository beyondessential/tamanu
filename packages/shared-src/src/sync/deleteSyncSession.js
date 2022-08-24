export const deleteSyncSession = async (store, sessionIndex) => {
  await store.sequelize.query(
    `
      DELETE FROM session_sync_records
      WHERE session_index = :sessionIndex
    `,
    {
      replacements: {
        sessionIndex,
      },
    },
  );

  await store.sequelize.query(
    `
      DELETE FROM sync_sessions
      WHERE id = :sessionIndex
    `,
    {
      replacements: {
        sessionIndex,
      },
    },
  );
}
  

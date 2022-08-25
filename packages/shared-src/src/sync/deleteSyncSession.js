export const deleteSyncSession = async (store, sessionIndex) => {
  await store.models.SessionSyncRecord.destroy({ where: { sessionIndex } });
  await store.models.SyncSession.destroy({ where: { id: sessionIndex } });
};

import { SYNC_SESSION_DIRECTION } from './constants';
import { getSnapshotTableName } from './manageSnapshotTable';

export const removeEchoedChanges = async (store, sessionId) => {
  const tableName = getSnapshotTableName(sessionId);
  return store.sequelize.query(
    `
    DELETE FROM ${tableName} outgoing
    USING ${tableName} incoming
    WHERE incoming.record_type = outgoing.record_type
      AND incoming.record_id = outgoing.record_id
      AND incoming.saved_at_sync_tick = outgoing.saved_at_sync_tick -- don't remove if an update has happened outside of this session
      AND incoming.updated_at_by_field_sum IS NOT DISTINCT FROM outgoing.updated_at_by_field_sum -- don't remove if the merge and save updated some fields
      AND incoming.direction = :incomingDirection
      AND outgoing.direction = :outgoingDirection
  `,
    {
      replacements: {
        incomingDirection: SYNC_SESSION_DIRECTION.INCOMING,
        outgoingDirection: SYNC_SESSION_DIRECTION.OUTGOING,
      },
    },
  );
};

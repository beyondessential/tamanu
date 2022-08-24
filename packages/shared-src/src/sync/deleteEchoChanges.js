import { SESSION_SYNC_DIRECTION } from './constants';

export const deleteEchoChanges = async (store, sessionIndex) =>
  store.sequelize.query(
    `
    DELETE FROM session_sync_records
    WHERE id in (SELECT outgoingchanges.id
    FROM session_sync_records AS incomingchanges
    JOIN session_sync_records AS outgoingchanges 
      ON incomingchanges.session_index = outgoingchanges.session_index 
      AND incomingchanges.direction = :incomingDirection
      AND outgoingchanges.direction = :outgoingDirection
      AND incomingchanges.session_index = :sessionIndex
    WHERE incomingchanges.record_id = outgoingchanges.record_id
      AND incomingchanges.record_type = outgoingchanges.record_type
      AND incomingchanges.data->>'updatedAtSyncIndex' = outgoingchanges.data->>'updatedAtSyncIndex')
  `,
    {
      replacements: {
        incomingDirection: SESSION_SYNC_DIRECTION.INCOMING,
        outgoingDirection: SESSION_SYNC_DIRECTION.OUTGOING,
        sessionIndex,
      },
    },
  );

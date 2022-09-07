import { SYNC_SESSION_DIRECTION } from './constants';

export const removeEchoedChanges = async (store, sessionIndex) =>
  store.sequelize.query(
    `
    DELETE FROM session_sync_records
    WHERE id in (SELECT outgoingchanges.id
    FROM session_sync_records AS incomingchanges
    JOIN session_sync_records AS outgoingchanges 
      ON incomingchanges.session_index = outgoingchanges.session_index 
      AND incomingchanges.record_type = outgoingchanges.record_type
      AND incomingchanges.data->>'updatedAtSyncIndex' = outgoingchanges.data->>'updatedAtSyncIndex')
      incomingchanges.record_id = outgoingchanges.record_id
    WHERE incomingchanges.direction = :incomingDirection
      AND outgoingchanges.direction = :outgoingDirection
      AND incomingchanges.session_index = :sessionIndex
  `,
    {
      replacements: {
        incomingDirection: SYNC_SESSION_DIRECTION.INCOMING,
        outgoingDirection: SYNC_SESSION_DIRECTION.OUTGOING,
        sessionIndex,
      },
    },
  );

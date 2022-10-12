import { SYNC_SESSION_DIRECTION } from './constants';

export const removeEchoedChanges = async (store, sessionId) =>
  store.sequelize.query(
    `
    DELETE FROM sync_session_records
    WHERE id in (SELECT outgoingchanges.id
    FROM sync_session_records AS incomingchanges
    JOIN sync_session_records AS outgoingchanges
      ON incomingchanges.session_id = outgoingchanges.session_id
      AND incomingchanges.record_type = outgoingchanges.record_type
      AND incomingchanges.data @> outgoingchanges.data AND incomingchanges.data <@ outgoingchanges.data
      AND incomingchanges.record_id = outgoingchanges.record_id
    WHERE incomingchanges.direction = :incomingDirection
      AND outgoingchanges.direction = :outgoingDirection
      AND incomingchanges.session_id = :sessionId)
  `,
    {
      replacements: {
        incomingDirection: SYNC_SESSION_DIRECTION.INCOMING,
        outgoingDirection: SYNC_SESSION_DIRECTION.OUTGOING,
        sessionId,
      },
    },
  );

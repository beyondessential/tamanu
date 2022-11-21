import { SYNC_SESSION_DIRECTION } from './constants';

export const removeEchoedChanges = async (store, sessionId) =>
  store.sequelize.query(
    `
    DELETE FROM sync_session_records outgoing
    USING sync_session_records incoming
    WHERE incoming.record_type = outgoing.record_type
      AND incoming.record_id = outgoing.record_id
      AND incoming.saved_at_sync_tick = outgoing.saved_at_sync_tick -- don't remove if an update has happened outside of this session
      AND incoming.updated_at_by_field_sum = outgoing.updated_at_by_field_sum -- don't remove if the merge and save updated some fields
      AND incoming.direction = :incomingDirection
      AND outgoing.direction = :outgoingDirection
      AND incoming.session_id = :sessionId
      AND outgoing.session_id = :sessionId
  `,
    {
      replacements: {
        incomingDirection: SYNC_SESSION_DIRECTION.INCOMING,
        outgoingDirection: SYNC_SESSION_DIRECTION.OUTGOING,
        sessionId,
      },
    },
  );

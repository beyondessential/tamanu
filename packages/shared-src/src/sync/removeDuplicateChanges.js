import { SYNC_SESSION_DIRECTION } from './constants';

export const removeDuplicateChanges = async (store, sessionId) =>
  store.sequelize.query(
    `
    DELETE FROM sync_session_records outgoing
    USING sync_session_records outgoing_duplicate
    WHERE outgoing.id < outgoing_duplicate.id
      AND outgoing.record_type = outgoing_duplicate.record_type
      AND outgoing.record_id = outgoing_duplicate.record_id
      AND outgoing.direction = :outgoingDirection
      AND outgoing_duplicate.direction = :outgoingDirection
      AND outgoing.session_id = :sessionId
      AND outgoing_duplicate.session_id = :sessionId
  `,
    {
      replacements: {
        outgoingDirection: SYNC_SESSION_DIRECTION.OUTGOING,
        sessionId,
      },
    },
  );

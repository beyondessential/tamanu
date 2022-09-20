import { SYNC_SESSION_DIRECTION } from './constants';

export const getOutgoingChangesCount = async (store, sessionId) => {
  const [rows] = await store.sequelize.query(
    `
        SELECT COUNT(*) AS total
        FROM session_sync_records
        JOIN sync_sessions
          ON session.id = session_sync_records.session_id
        WHERE session.id = :sessionId
          AND direction = :direction
    `,
    {
      replacements: {
        sessionId,
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
      },
    },
  );

  return rows[0]?.total || 0;
};

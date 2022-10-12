import { SYNC_SESSION_DIRECTION } from './constants';

export const getOutgoingChangesCount = async (store, sessionId) => {
  const [rows] = await store.sequelize.query(
    `
        SELECT COUNT(*) AS total
        FROM sync_session_records
        WHERE session_id = :sessionId
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

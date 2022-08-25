import { SESSION_SYNC_DIRECTION } from './constants';

export const getOutgoingChangesCount = async (store, sessionIndex) => {
  const [rows] = await store.sequelize.query(
    `
        SELECT COUNT(*) AS total
        FROM session_sync_records
        WHERE session_index = :sessionIndex
          AND direction = :direction
    `,
    {
      replacements: {
        sessionIndex,
        direction: SESSION_SYNC_DIRECTION.OUTGOING,
      },
    },
  );

  return rows[0]?.total || 0;
};

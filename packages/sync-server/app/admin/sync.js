import asyncHandler from 'express-async-handler';

export const syncLastCompleted = asyncHandler(async (req, res) => {
  const { store } = req;
  const {
    models: { SyncSession },
  } = store;

  const [lastCompleteds] = await store.sequelize.query(`
    SELECT
        (debug_info->>'facilityId') AS facility,
        max(completed_at) AS timestamp
    FROM sync_sessions
    WHERE true
        AND completed_at IS NOT NULL
        AND debug_info->>'facilityId' IS NOT NULL
    GROUP BY facility
  `);

  const sessions = await Promise.all(
    lastCompleteds.map(async ({ facility, timestamp }) => {
      return SyncSession.findOne({
        where: {
          completedAt: timestamp,
          'debugInfo.facilityId': facility,
        },
      });
    }),
  );

  res.send({
    data: sessions.map(session => ({
      facilityId: session.debugInfo.facilityId,
      completedAt: session.completedAt,
      duration: session.completedAt - session.createdAt,
    })),
    count: lastCompleteds.length,
  });
});

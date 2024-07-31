import asyncHandler from 'express-async-handler';

export const syncLastCompleted = asyncHandler(async (req, res) => {
  req.flagPermissionChecked();

  const { store } = req;
  const {
    models: { SyncSession },
  } = store;

  const [lastCompleteds] = await store.sequelize.query(`
    SELECT
        (debug_info->>'facilityIds') AS facilities,
        max(completed_at) AS timestamp
    FROM sync_sessions
    WHERE true
        AND completed_at IS NOT NULL
        AND debug_info->>'facilityIds' IS NOT NULL
    GROUP BY facilityIds
  `);

  const sessions = await Promise.all(
    lastCompleteds.map(async ({ facilities, timestamp }) => {
      return SyncSession.findOne({
        where: {
          completedAt: timestamp,
          'debugInfo.facilityIds': facilities,
        },
      });
    }),
  );

  res.send({
    data: sessions.map(session => ({
      facilityIds: session.debugInfo.facilityIds,
      completedAt: session.completedAt,
      duration: session.completedAt - session.createdAt,
    })),
    count: lastCompleteds.length,
  });
});

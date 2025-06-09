import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

export const syncLastCompleted = asyncHandler(async (req, res) => {
  req.flagPermissionChecked();

  const { store } = req;
  const {
    models: { SyncSession },
  } = store;

  const [lastCompleteds] = await store.sequelize.query(`
    SELECT
        coalesce(parameters->>'facilityIds', debug_info->>'facilityIds', debug_info->>'facilityId') AS facilities,
        max(completed_at) AS timestamp
    FROM sync_sessions
    WHERE true
        AND completed_at IS NOT NULL
        AND coalesce(parameters->>'facilityIds', debug_info->>'facilityIds', debug_info->>'facilityId') IS NOT NULL
    GROUP BY facilities
  `);

  const sessions = await Promise.all(
    lastCompleteds.map(async ({ facilities, timestamp }) => {
      return SyncSession.findOne({
        where: {
          completedAt: timestamp,
          [Op.or]: [
            { 'debugInfo.facilityId': facilities }, // support displaying legacy format of syncs limited to one facility id
            { 'debugInfo.facilityIds': facilities },
            { 'parameters.facilityIds': facilities },
          ],
        },
      });
    }),
  );

  res.send({
    data: sessions.map((session) => ({
      facilityIds: session.parameters.facilityIds ||
        session.debugInfo.facilityIds || [session.debugInfo.facilityId],
      completedAt: session.completedAt,
      duration: session.completedAt - session.createdAt,
    })),
    count: lastCompleteds.length,
  });
});

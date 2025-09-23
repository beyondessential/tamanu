import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import * as z from 'zod';

export const syncLastCompleted = asyncHandler(async (req, res) => {
  req.flagPermissionChecked();

  const { store, query } = req;
  const {
    models: { SyncSession },
  } = store;

  const { page, rowsPerPage, order, orderBy } = await z
    .object({
      page: z.number().min(1).default(1),
      rowsPerPage: z.number().min(1).max(50).default(10),
      order: z.enum(['asc', 'desc']).default('desc'),
      orderBy: z
        .enum([
          'completedAt',
          'deviceId',
          'deviceType',
          'duration',
          'facilityIds',
          'recordsPulled',
          'tick',
        ])
        .default('completedAt'),
    })
    .parseAsync(query);

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
            { 'debugInfo.facilityId': facilities },
            { 'debugInfo.facilityIds': facilities },
            { 'parameters.facilityIds': facilities },
          ],
        },
      });
    }),
  );

  res.send({
    data: sessions
      .map(session => ({
        facilityIds: session.parameters.facilityIds ||
          session.debugInfo.facilityIds || [session.debugInfo.facilityId],
        completedAt: session.completedAt,
        duration: session.completedAt - session.createdAt,
        deviceId: session.parameters.deviceId,
        deviceType: session.parameters.isMobile ? 'mobile' : 'facility',
        recordsPulled: session.debugInfo.totalToPull ?? 0,
        tick: session.pullSince,
      }))
      .sort((oa, ob) => {
        const [a, b] = order === 'desc' ? [ob, oa] : [oa, ob];
        if (orderBy === 'completedAt') {
          return a.completedAt - b.completedAt;
        } else if (orderBy === 'deviceId') {
          return a.deviceId.localeCompare(b.deviceId);
        } else if (orderBy === 'deviceType') {
          return a.deviceType.localeCompare(b.deviceType);
        } else if (orderBy === 'duration') {
          return a.duration - b.duration;
        } else if (orderBy === 'facilityIds') {
          return a.facilityIds[0].localeCompare(b.facilityIds[0]);
        } else if (orderBy === 'recordsPulled') {
          return a.recordsPulled - b.recordsPulled;
        } else if (orderBy === 'tick') {
          return a.tick - b.tick;
        } else {
          return 0;
        }
      })
      .slice((page - 1) * rowsPerPage, page * rowsPerPage),
    count: lastCompleteds.length,
  });
});

import asyncHandler from 'express-async-handler';

export const syncLastCompleted = asyncHandler(async (req, res) => {
  const { store } = req;

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

  res.send({
    data: lastCompleteds,
    count: lastCompleteds.length,
  });
});

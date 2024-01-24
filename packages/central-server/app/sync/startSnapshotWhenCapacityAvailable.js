import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';

const startSnapshotIfCapacityAvailable = async ({ settings, sequelize }, sessionId) => {
  const numberConcurrentPullSnapshots = await settings.get('sync.numberConcurrentPullSnapshots');
  // work out how many sessions are currently in the snapshot phase
  const [, affectedRows] = await sequelize.query(
    `
    WITH in_flight_snapshots AS (
      SELECT COUNT(*) AS count FROM sync_sessions
      WHERE snapshot_started_at IS NOT NULL
      AND snapshot_completed_at IS NULL
      AND error IS NULL
      AND completed_at IS NULL
    )
    UPDATE sync_sessions
    SET snapshot_started_at = NOW()
    FROM in_flight_snapshots
    WHERE id = :sessionId
    AND in_flight_snapshots.count < :numberConcurrentPullSnapshots;
    `,
    {
      replacements: {
        sessionId,
        numberConcurrentPullSnapshots,
      },
      type: sequelize.QueryTypes.UPDATE,
    },
  );
  const success = affectedRows === 1;
  return success;
};

export const startSnapshotWhenCapacityAvailable = async (context, sessionId) => {
  // wait for there to be enough capacity to start a snapshot
  while (!(await startSnapshotIfCapacityAvailable(context, sessionId))) {
    await sleepAsync(500); // wait for half a second
  }
};

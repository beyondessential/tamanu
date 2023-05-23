export const getSyncTicksOfPendingEdits = async (sequelize, syncTick) => {
  // Get the keys (ie: syncTicks) of all the in-flight transaction locks of previously pending edits.
  // Since advisory locks are global, and:
  // - in-flight transaction locks are 'ShareLock'
  // - sync snapshot locks which are `ExclusiveLock`
  // => Only select for in-flight transaction locks by filtering for `ShareLock`
  // to avoid clashing with the sync snapshot locks
  const [results] = await sequelize.query(
    `
      SELECT objid AS tick FROM pg_locks
      WHERE locktype = 'advisory'
      AND mode = 'ShareLock' -- filter by
      AND objid < :syncTick;
    `,
    {
      replacements: { syncTick },
    },
  );

  return results.map(r => r.tick);
};

export const getSyncTicksOfPendingEdits = async (sequelize, syncTick) => {
  // Get the keys (ie: syncTicks) of all the pending locks
  const [results] = await sequelize.query(
    `
      SELECT objid AS tick FROM pg_locks
      WHERE locktype = 'advisory'
      AND objid < :syncTick;
    `,
    {
      replacements: { syncTick },
    },
  );

  return results.map(r => r.tick);
};

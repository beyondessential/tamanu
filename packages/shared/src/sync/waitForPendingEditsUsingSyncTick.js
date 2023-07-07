// wait for any locks using the current sync clock tick as the id - these locks are also
// taken during create/update triggers on synced tables, so this ensures that any pending
// transactions that involve a create/update of a record have finished
export const waitForPendingEditsUsingSyncTick = async (sequelize, syncTick) =>
  sequelize.query(
    `
      SELECT pg_advisory_xact_lock(:syncTick);
    `,
    {
      replacements: { syncTick },
    },
  );

import { BLOB_TIERS } from '@tamanu/constants';

// spec: CAP
// The outbox at a glance: how much un-pushed content this server is carrying
// and the worst dysfunction measure among it. Served on the sync status
// endpoint and logged by the pusher's escalation.
export async function blobOutboxStatus(models) {
  const row = await models.Blob.sequelize.query(
    `
      SELECT
        COUNT(*)::integer AS count,
        COALESCE(SUM(size), 0)::bigint AS total_bytes,
        COALESCE(MAX(sync_cycles_unpushed), 0)::integer AS max_sync_cycles_unpushed
      FROM blobs
      WHERE tier = $tier
    `,
    { bind: { tier: BLOB_TIERS.OUTBOX }, plain: true },
  );
  return {
    count: row.count,
    totalBytes: Number(row.total_bytes),
    maxSyncCyclesUnpushed: row.max_sync_cycles_unpushed,
  };
}

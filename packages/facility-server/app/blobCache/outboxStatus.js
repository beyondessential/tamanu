import { BLOB_TIERS } from '@tamanu/constants';

// spec: CAP
// Compare oldestEligibleTick with the current push cursor (the sync status endpoint exposes both).
export async function blobOutboxStatus(models) {
  const row = await models.Blob.sequelize.query(
    `
      SELECT
        COUNT(*)::integer AS count,
        COALESCE(SUM(size), 0)::bigint AS total_bytes,
        MIN(eligible_since_tick) AS oldest_eligible_tick
      FROM blobs
      WHERE tier = $tier
    `,
    { bind: { tier: BLOB_TIERS.OUTBOX }, plain: true },
  );
  return {
    count: row.count,
    totalBytes: Number(row.total_bytes),
    oldestEligibleTick: row.oldest_eligible_tick == null ? null : Number(row.oldest_eligible_tick),
  };
}

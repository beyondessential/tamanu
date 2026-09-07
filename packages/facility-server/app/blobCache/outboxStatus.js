import { BLOB_TIERS } from '@tamanu/constants';

// spec: CAP
// The outbox at a glance: how much un-pushed content this server is carrying,
// and the oldest push cursor at which any of it became eligible for push. A
// consumer compares oldestEligibleTick against the current push cursor (the
// sync status endpoint exposes both) to gauge how long a blob has gone unpushed
// while syncs kept succeeding — the outbox dysfunction signal.
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
    // The smallest (oldest) marker is the blob eligible the longest; null when
    // nothing in the outbox is eligible yet.
    oldestEligibleTick: row.oldest_eligible_tick == null ? null : Number(row.oldest_eligible_tick),
  };
}

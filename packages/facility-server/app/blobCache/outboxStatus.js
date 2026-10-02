import { BLOB_SCAN_VERDICTS, BLOB_TIERS } from '@tamanu/constants';

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
        -- Withheld content never leaves, so counting it would read as a stuck outbox.
        AND scan_verdict IS DISTINCT FROM $infected
        AND hash NOT IN (SELECT hash FROM blob_quarantines WHERE deleted_at IS NULL)
    `,
    { bind: { tier: BLOB_TIERS.OUTBOX, infected: BLOB_SCAN_VERDICTS.INFECTED }, plain: true },
  );
  return {
    count: row.count,
    totalBytes: Number(row.total_bytes),
    oldestEligibleTick: row.oldest_eligible_tick == null ? null : Number(row.oldest_eligible_tick),
  };
}

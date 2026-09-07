import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };
const INDEX = 'blobs_last_scrubbed_at';

// spec: SCRUB
// Scrub state for the blob registry. `last_scrubbed_at` is when the blob was
// last verified against its hash; the result of that verification is the
// integrity state as of that moment, so it needs no column of its own. Null
// means never scrubbed, which the scrub takes first.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'last_scrubbed_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  // Written out rather than through addIndex: the scan orders NULLS FIRST so a
  // never-scrubbed blob is taken ahead of a stale one, and a default (NULLS
  // LAST) index does not serve that ordering.
  await query.sequelize.query(
    `CREATE INDEX ${INDEX} ON blobs (last_scrubbed_at ASC NULLS FIRST)`,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX ${INDEX}`);
  await query.removeColumn(TABLE, 'last_scrubbed_at');
}

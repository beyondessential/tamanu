import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };
const INDEX = 'blobs_scan_candidates';

// spec: AV
// What this server's antivirus scan found in each blob, and the scanner that
// found it. Orthogonal to integrity_state: infected content matches its hash,
// so a verdict says nothing about integrity and integrity says nothing about a
// verdict. Null verdict is not-yet-scanned, which is the state of every blob on
// a deployment with no scanner configured, and the state the serve policy
// decides what to do with. The scanner and signature versions are what a
// re-scan compares against when definitions move on.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'scan_verdict', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'scanned_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'scanner_version', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'signature_version', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  // The scan pass runs on a schedule against the whole registry, so it needs an
  // index that serves both its filter and its order or it degrades to a scan
  // and sort of every blob the server holds. Partial on what the pass can act
  // on: infected content is terminal and corrupt content has nothing servable
  // to scan. Written out rather than through addIndex, for the same reason the
  // scrub's index is: the scan takes never-scanned blobs first, and a default
  // (NULLS LAST) index does not serve that ordering.
  await query.sequelize.query(`
    CREATE INDEX ${INDEX} ON blobs (scanned_at ASC NULLS FIRST, created_at ASC)
    WHERE integrity_state = 'verified' AND scan_verdict IS DISTINCT FROM 'infected'
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX ${INDEX}`);
  await query.removeColumn(TABLE, 'signature_version');
  await query.removeColumn(TABLE, 'scanner_version');
  await query.removeColumn(TABLE, 'scanned_at');
  await query.removeColumn(TABLE, 'scan_verdict');
}

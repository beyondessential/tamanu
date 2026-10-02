import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };
const INDEX = 'blobs_scan_candidates';

// spec: AV
// Orthogonal to integrity_state: infected content matches its hash.
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
  // Raw SQL rather than addIndex: the scan takes never-scanned blobs first, which a default NULLS
  // LAST index doesn't serve.
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

import { DataTypes, QueryInterface } from 'sequelize';

const REFERENCE_TABLES = ['attachments', 'assets'] as const;

// spec: BKFL, CAS
// Reference rows carry the hash of their content instead of the bytes. Both
// columns are nullable through the backfill: a row holds bytes until it is
// moved and a hash afterwards, and the two forms coexist until the backfill
// completes.
export async function up(query: QueryInterface): Promise<void> {
  for (const tableName of REFERENCE_TABLES) {
    await query.addColumn(tableName, 'hash', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    await query.changeColumn(tableName, 'data', {
      type: DataTypes.BLOB,
      allowNull: true,
    });
    // Reclamation and completion checks both scan references by hash.
    await query.addIndex(tableName, ['hash'], {
      name: `${tableName}_hash`,
    });
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const tableName of REFERENCE_TABLES) {
    // DESTRUCTIVE: rows whose bytes have been moved into the blob store have
    // no data to restore here, so the NOT NULL cannot be reinstated. Run the
    // backfill rollback first to re-inflate them from the store.
    await query.removeIndex(tableName, `${tableName}_hash`);
    await query.removeColumn(tableName, 'hash');
  }
}

import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'assets', schema: 'public' };

// spec: ASSET
// Assets move onto the blob store: the image bytes live there addressed by a
// content hash, so the row records the hash and no longer requires inline bytes.
// `hash` is nullable and `data` becomes nullable so legacy rows (bytes inline,
// no hash) and new rows (hash, no bytes) coexist until the backfill card moves
// the remaining legacy rows; readers accept both forms.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'hash', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.changeColumn(TABLE, 'data', {
    type: DataTypes.BLOB,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'hash');
  // A row whose bytes moved to the store has a null `data`, so this fails while
  // any such row exists and the whole migration rolls back, `hash` included. That
  // is deliberate: dropping `hash` while `data` is null would leave the row naming
  // nothing, with its content stranded in the store. The backfill rollback has to
  // run first, and this is what stops a downgrade that skipped it.
  await query.changeColumn(TABLE, 'data', {
    type: DataTypes.BLOB,
    allowNull: false,
  });
}

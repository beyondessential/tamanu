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
  // DESTRUCTIVE: rows whose bytes moved to the blob store have a null `data`;
  // restoring NOT NULL would fail against them, so `data` is left nullable.
}

import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'attachments', schema: 'public' };

// spec: ATCH
// A hash-backed attachment holds the hash of its content and stores its bytes in
// the blob store; the in-database `data` column remains only for legacy rows, so
// it becomes nullable.
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
  // DESTRUCTIVE: hash-backed rows have no in-database bytes, so restoring the NOT
  // NULL constraint fails while any such row exists; those rows must be backfilled
  // or removed before rolling back.
  await query.changeColumn(TABLE, 'data', {
    type: DataTypes.BLOB,
    allowNull: false,
  });
}

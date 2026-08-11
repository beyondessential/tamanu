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
  // A hash-backed row has no in-database bytes, so this fails while any such row
  // exists and the whole migration rolls back, `hash` included. That is
  // deliberate: dropping `hash` while `data` is null would leave the row naming
  // nothing, with its content stranded in the store. The backfill rollback has to
  // run first, and this is what stops a downgrade that skipped it.
  await query.changeColumn(TABLE, 'data', {
    type: DataTypes.BLOB,
    allowNull: false,
  });
}

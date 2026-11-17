import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'attachments', schema: 'public' };

// spec: ATCH
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
  // Fails while any row's bytes are in the store, rolling the migration back: the backfill rollback
  // must run first.
  await query.changeColumn(TABLE, 'data', {
    type: DataTypes.BLOB,
    allowNull: false,
  });
}

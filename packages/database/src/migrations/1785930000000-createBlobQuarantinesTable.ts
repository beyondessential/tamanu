import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE = 'blob_quarantines';

// spec: AV
// Content known to be malware, named by hash. Separate from the `blobs`
// registry because the two answer different questions: `blobs` is what this
// server holds and never leaves it, while this is what is known about content
// anywhere and syncs out from central to every server and device. A row here
// stops the content being served, fetched, or healed wherever it is held, and
// outlives every copy of it.
export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.TEXT,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scanner_version: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    signature_version: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
  // The read path asks "is this hash known bad" on every serve, and the hash is
  // the identity of the record.
  await query.addIndex(TABLE, ['hash'], { unique: true, name: 'blob_quarantines_hash' });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}

import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE = 'blob_quarantines';

// spec: AV
// Separate from `blobs`: this is what's known about content anywhere, syncs out from central, and
// outlives every copy.
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
  // Sync-apply defers unique checks to the end of its transaction, so every unique constraint on a
  // syncable table is deferrable.
  await query.sequelize.query(`
    ALTER TABLE ${TABLE}
    ADD CONSTRAINT blob_quarantines_hash
      UNIQUE (hash)
      DEFERRABLE INITIALLY IMMEDIATE;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}

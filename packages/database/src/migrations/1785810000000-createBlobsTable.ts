import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };

// spec: CAS
// The local blob registry: which blobs this server holds on disk, their size,
// and their integrity state. Local to each server — never synced and excluded
// from change logging (see services/migrations/constants.ts).
export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.STRING,
      defaultValue: query.sequelize.literal('gen_random_uuid()'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: query.sequelize.literal('now()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: query.sequelize.literal('now()'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    integrity_state: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'verified',
    },
  });
  await query.addIndex(TABLE, ['hash'], {
    unique: true,
    name: 'blobs_hash',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}

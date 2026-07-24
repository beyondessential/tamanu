import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'idempotency_keys', schema: 'public' };

// spec: IDEM
// Records the outcome of a mutating request that carried an `Idempotency-Key`
// header, so a retried request returns the original outcome instead of executing
// twice. DO_NOT_SYNC operational state, local to each server. Ships on both
// central and facility; only facility writes to it for now (central sits empty).
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
      allowNull: false,
      defaultValue: query.sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: query.sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    facility_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'facilities', key: 'id' },
    },
    method: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    path: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    request_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    response_body: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Dedup and lookup key, and the row-lock point that serialises concurrent
  // retries of the same operation. Scoped by user + facility so a key presented
  // under a different context can't resolve to another context's outcome.
  await query.addIndex(TABLE, ['key', 'user_id', 'facility_id'], {
    unique: true,
    name: 'idempotency_keys_key_user_facility',
  });
  // Cleanup scans by retention horizon.
  await query.addIndex(TABLE, ['expires_at'], {
    name: 'idempotency_keys_expires_at',
  });
  // Lease-reclamation scans (only exercised once a committed in-progress marker
  // is used; see the plan's transaction-topology note).
  await query.addIndex(TABLE, ['status', 'claimed_at'], {
    name: 'idempotency_keys_status_claimed_at',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}

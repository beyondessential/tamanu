import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const WEBAUTHN_CREDENTIALS = 'webauthn_credentials';
const TOTP_SECRETS = 'totp_secrets';
const MFA_CHALLENGES = 'mfa_challenges';

const timestamps = {
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
};

export async function up(query: QueryInterface): Promise<void> {
  // WebAuthn (passkey) credentials: public keys only, so safe to sync
  // everywhere (BIDIRECTIONAL) — a credential enrolled at one server is
  // verifiable offline at any other in-zone server. No signature counter
  // column: we never enforce it (synced passkeys report 0 by design, and
  // counters regress routinely across a sync-lagged topology).
  await query.createTable(WEBAUTHN_CREDENTIALS, {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    ...timestamps,
    updated_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    credential_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    public_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rp_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    transports: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    aaguid: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    enrolment_origin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    friendly_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
  // partial: removal soft-deletes (sync needs the tombstone), and a removed
  // authenticator must be re-enrollable
  await query.sequelize.query(`
    CREATE UNIQUE INDEX idx_${WEBAUTHN_CREDENTIALS}_credential_id_unique
    ON ${WEBAUTHN_CREDENTIALS} (credential_id)
    WHERE deleted_at IS NULL
  `);
  await query.addIndex(WEBAUTHN_CREDENTIALS, ['user_id']);

  // TOTP seeds: symmetric secrets, central-only (DO_NOT_SYNC — also listed in
  // NON_SYNCING_TABLES). The secret column holds an encryptSecret() envelope
  // (S1:{iv}:{ciphertext}), never plaintext. One seed per user; pending until
  // confirmed_at is set.
  await query.createTable(TOTP_SECRETS, {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    ...timestamps,
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    secret: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
  await query.addIndex(TOTP_SECRETS, ['user_id'], {
    unique: true,
    name: `idx_${TOTP_SECRETS}_user_id_unique`,
  });

  // Ephemeral single-use MFA tokens (OneTimeLogin pattern, DO_NOT_SYNC):
  // WebAuthn ceremony challenges and admin enrolment-invite tokens. user_id is
  // nullable because usernameless assertion challenges are issued before the
  // user is known.
  await query.createTable(MFA_CHALLENGES, {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    ...timestamps,
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
  await query.addIndex(MFA_CHALLENGES, ['token']);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(MFA_CHALLENGES);
  await query.dropTable(TOTP_SECRETS);
  await query.dropTable(WEBAUTHN_CREDENTIALS);
}
